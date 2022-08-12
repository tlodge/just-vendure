import { Controller, Get, Post, Delete, Param, Redirect, Body, Query } from '@nestjs/common';

import {
        Ctx, 
        PluginCommonModule, 
        RequestContext, 
        OrderService, 
        VendurePlugin, 
        Order, 
        ProductVariant, 
        ProductVariantService, 
        ChannelService, 
        TransactionalConnection, 
        Channel, 
        ShippingMethod, 
        isGraphQlErrorResult, 
        ID
} from '@vendure/core';

import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';
import { AccountConnectionService } from './services/AccountConnectionService';
import { SubAccountService } from './services/SubAccountService';
import { CreateAddressInput } from '@vendure/common/lib/generated-shop-types';

import { adminApiExtensions } from './api/sub-api-extensions';
import {SubAccountEntityResolver } from './api/sub-account-entity-resolver';
import { SubAccount } from './entities/subaccount.entity';

export class OrderParam {
    orderId: string;
}

interface VariantQuantity {
    variant : ProductVariant,
    quantity : number
}

@Controller('create-payment-intent')
export class PaymentIntentController {
    constructor(@InjectStripe() private readonly stripeClient: Stripe, 
    private orderService: OrderService, 
    private accountConnectionService: AccountConnectionService, 
    private subAccountService: SubAccountService,
    private productVariantService: ProductVariantService,  
    private channelService: ChannelService, 
    
    private connection: TransactionalConnection) {}

    async createVendorSubOrder(ctx:RequestContext, order:Order, channelId:ID, defaultchannel:Channel, variantsbyvendor: {[key:string]:VariantQuantity[]}){
        
        const {code:orderId} = order;

        let neworder = await this.orderService.create(ctx);

        //set the channel of this order!
        neworder.channels = [defaultchannel];
        const channel = await this.connection.getEntityOrThrow(ctx, Channel, channelId);
        neworder.channels.push(channel);
    
        //save the customer and shipping lines
        neworder.customer = order?.customer;
        neworder.shippingLines = order.shippingLines;

        await this.connection.getRepository(ctx, Order).save(neworder, { reload: false });

        let vendorprice = 0;

        for (const vc of variantsbyvendor[channelId]){
            console.log("------------");
            console.log(vc.variant.sku, vc.quantity);
            const {price} = vc.variant.productVariantPrices.filter(pvp=>pvp.channelId==channelId)[0];
            console.log("------------");
            vendorprice += price;
            await this.orderService.addItemToOrder(ctx, neworder.id, vc.variant.id, vc.quantity); //TODO - record the product variant quantity too
        }

        const { fullName:sfullName="", company:scompany="", streetLine1:sstreetLine1="",city:scity="", postalCode:spostalCode="", countryCode:scountryCode=""} = order.shippingAddress;
        const { fullName:bfullName="", company:bcompany="", streetLine1:bstreetLine1="",city:bcity="", postalCode:bpostalCode="", countryCode:bcountryCode=""} = order.billingAddress;

        const shippingaddress:CreateAddressInput = {
            fullName:sfullName,
            company:scompany,
            streetLine1:sstreetLine1,
            city:scity,
            postalCode:spostalCode,
            countryCode:scountryCode,
        }

        const billingaddress:CreateAddressInput = {
            fullName:bfullName,
            company:bcompany,
            streetLine1:bstreetLine1,
            city:bcity,
            postalCode:bpostalCode,
            countryCode:bcountryCode,
        }


        await this.orderService.setShippingAddress(ctx, neworder.id, shippingaddress);
        

        for (const shippingLine of order.shippingLines){
            await this.orderService.setShippingMethod(ctx, neworder.id, shippingLine.id);
            if (shippingLine?.shippingMethodId){
                await this.channelService.assignToChannels(ctx,ShippingMethod,shippingLine?.shippingMethodId, [channelId]);
            }
        }
        
        const  trans = await this.orderService.transitionToState(ctx, neworder.id, 'ArrangingPayment');
        await this.orderService.setBillingAddress(ctx,neworder.id,billingaddress);
        
        //record the linkage between this account and the subaccount
        await this.subAccountService.createLink(ctx, order.id, neworder.id);

        /*
        * Now disburse the money to the relevant connected account!!
        */
        const connectedAccount = await this.accountConnectionService.fetchByChannelId(ctx, channelId);
        console.log("have connected account", connectedAccount);
        
        if (connectedAccount){
            
            await this.stripeClient.transfers.create({
                amount: vendorprice,
                currency: 'gbp',
                destination: connectedAccount.id,
                metadata:{
                    orderId: neworder.id
                },
                transfer_group: orderId,
            });
        }
    }

    async assignToVendor(ctx:RequestContext, order:Order, channellist:Channel[]){
        const entity = await this.connection.getEntityOrThrow(ctx, Order, order.id, {relations: ['channels', 'lines', 'shippingLines']}); 
            
        //we need to manually add this order to the vendor's channel as this.channelService.assignToChannels
        //does not work with orders since they need to be hydrated!
        const channel = await this.connection.getEntityOrThrow(ctx, Channel, channellist[0].id);
        entity.channels.push(channel);
        await this.connection.getRepository(ctx, Order).save(entity, { reload: false });
        
        //if the shipping lines that were chosen (which belong to the default channel), do not exist for this 
        //vendor's channel then add them here
        for (const shippingLine of entity.shippingLines){
            if (shippingLine?.shippingMethodId){
                await this.channelService.assignToChannels(ctx,ShippingMethod,shippingLine?.shippingMethodId, [channellist[0].id]);
            }
        }

        const  transition = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
        if (!isGraphQlErrorResult(transition)) { 
            console.log("successfully transitioned state to ArrangingPayment for", order.id);
        }else{
            console.log("error");
            console.log(transition);
        }

        const connectedAccount = await this.accountConnectionService.fetchByChannelId(ctx, channellist[0].id);
        
        //TODO: update the  payment details for this order!
        await this.stripeClient.transfers.create({
            amount: 20,
            currency: 'gbp',
            destination: connectedAccount.id,
            metadata:{
                orderId: order.id
            },
            transfer_group: order.code,
        });
    }


    async splitIntoVendorOrders(ctx:RequestContext, order:Order){
        const {lines} = order as Order;


        /*
        * Create a list of the variants in this order and the quantity ordered of each
        */
        const variants: VariantQuantity[]  = lines.map(l=>{
            return {
                variant: l.productVariant, 
                quantity:l.quantity
            }
        });

       /*
        * Split orders into the different vendors.  Each vendor has their own channel, so we create a lookup
        * obj, variantsbyvebdor which has channelId as key and list of associated variants  
        */
        const channellist : Channel[] =  [];
        let variantsbyvendor: {[key:string]:VariantQuantity[]} = {};  //we use this to create new orders by variant

        for (const vq of variants){
            const channels = await this.productVariantService.getProductVariantChannels(ctx, vq.variant.id);
            channels.filter(v=>v.code!="__default_channel__").forEach(c=>{
                if (channellist.map(c=>c.code).indexOf(c.code) == -1){
                    channellist.push(c);
                    variantsbyvendor[c.id] = [...(variantsbyvendor[c.id]||[]), vq]
                }
            })
        } 

        const defaultchannel = await this.channelService.getDefaultChannel();
        //if we have multiple vendors responsible for items in this order we need to split the order into sub-orders
       
        if (channellist.length > 1 && order?.id){ //check for order.id to stop typescript complaining
            for (const channelId of Object.keys(variantsbyvendor)){
                await this.createVendorSubOrder(ctx, order, channelId, defaultchannel, variantsbyvendor);
            }
        }
        // if we have a single vendor responsible for all items in this order then we need to make sure that this order is assigned to the vendor's channel
        // note we can't do this with the channelservice as the order needs to be hydrated prior to updating!
        else if (channellist.length == 1 && order?.id){
            await this.assignToVendor(ctx, order, channellist)
        }
    }


   /*
    * This is a multi-stage workflow that works as follows:
    * First we split the order into sub-orders based upon channelIds associated with the products
    * We then create separate transfers for each connected account associated with the user
    * assuming that such an account exists.
    */
    @Post()
    async paymentIntent(@Body() param: OrderParam, @Ctx() ctx: RequestContext) {
       
        const { orderId = '' } = param;
        const order = await this.orderService.findOneByCode(ctx, orderId);
 
        /*
        * Appears that we need to transition to arranging payment now, else the shipping details are lost when we 
        * split into suborders!
        */        
       const  transition = await this.orderService.transitionToState(ctx, order?.id || -1, 'ArrangingPayment');
           
        if (!isGraphQlErrorResult(transition)) { 
            console.log("successfully transitioned state to ArrangingPayment for", order?.id || -1);
            //log error here!!
        }else{
            console.log("error");
            console.log(transition);
        }


        const params: Stripe.PaymentIntentCreateParams = {
            payment_method_types: ['card'],
            amount: order?.totalWithTax || 0,
            capture_method: 'automatic',
            currency: 'gbp',
            description: process.env.STRIPE_PAYMENT_DESCRIPTION ?? '',
            metadata: {
                reference: orderId,
            },
            transfer_group: orderId,
        };

        if (order) { 
            await this.splitIntoVendorOrders(ctx, order);
        }

        const payment_intent: Stripe.PaymentIntent = await this.stripeClient.paymentIntents.create(params);
        const { client_secret: token } = payment_intent;
        return { token };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const deleted = await this.stripeClient.accounts.del(id);
        return { deleted };
    }
}

//admin API extendions creates the necessary tables!

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [PaymentIntentController],
    providers: [AccountConnectionService,SubAccountService],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [SubAccountEntityResolver],
    },
    entities: [SubAccount],
})

export class PaymentIntentPlugin {}
