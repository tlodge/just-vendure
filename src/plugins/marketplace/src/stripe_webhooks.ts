import { Controller, Get, Post, Delete, Param, Redirect, Body, Query } from '@nestjs/common';
import { Ctx, PluginCommonModule, RequestContext, OrderService, VendurePlugin, Order, ProductVariant, ProductVariantService, ChannelService, TransactionalConnection, Channel, ShippingMethod, isGraphQlErrorResult } from '@vendure/core';
import { AccountConnectionService } from './services/AccountConnectionService';
import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';
import { CreateAddressInput } from 'src/plugins/reviews/generated-shop-types';



//TODO:

//Sometimes need to delete cookies in browser else do NOT get customer!

//This is called by stripe once the order has gone through and it will update the order
//To show that it is complete.  It then needs

interface VariantQuantity {
    variant : ProductVariant,
    quantity : number
}

@Controller('stripe-webhook')
export class StripeWebhookController {
    constructor(@InjectStripe() private readonly stripeClient: Stripe, private orderService: OrderService, private accountConnectionService: AccountConnectionService, private productVariantService: ProductVariantService,  private channelService: ChannelService, private connection: TransactionalConnection) {}
    @Post()
    async stripeWebhook(@Body() param: any, @Ctx() ctx: RequestContext) {
      

        if (param.type === 'charge.succeeded') {
            console.log("seen a charge succeeded!");
            const { data } = param;
            

            const { object } = data;
            const { metadata, id } = object;
            const { reference: orderId } = metadata;

            const input = {
                method: 'stripe',
                metadata: {
                    id,
                },
            };

            const order = await this.orderService.findOneByCode(ctx, orderId);

            console.log("---------------  order --------------");
            console.log("payment for", order?.id);
            console.log("--------------------------------------");

            const {lines} = order as Order;
            const variants: VariantQuantity[]  = lines.map(l=>{
                console.log("l quantity is", l.quantity);
                return {
                         variant: l.productVariant, 
                         quantity:l.quantity
                }
            });

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

            console.log("vendors in this order are", channellist.map(c=>c.code));
            const defaultchannel = await this.channelService.getDefaultChannel();
            //if we have multiple vendors responsible for items in this order we need to split the order into sub-orders
            if (channellist.length > 1 && order?.id){ //check for order.id to stop typescript complaining
            
                for (const channelId of Object.keys(variantsbyvendor)){
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
                  
                    
                    //figure out how to set the customer...!
                    const  trans = await this.orderService.transitionToState(ctx, neworder.id, 'ArrangingPayment');
                    await this.orderService.setBillingAddress(ctx,neworder.id,billingaddress);
                    
                
                    const result = await this.orderService.addPaymentToOrder(ctx, neworder.id, input);
                    
                    if (!isGraphQlErrorResult(result)) { //guard to stop typescript complaining!
                        console.log(result.code);
                        console.log("subtotal", result.subTotalWithTax);
                        console.log("shipping", result.shippingWithTax);
                        console.log("vendor price is", vendorprice);
                    }
                    console.log("--------------------------");

                    /*
                     * Now disburse the money to the relevant connected account!!
                     */
                    const connectedAccount = await this.accountConnectionService.fetchByChannelId(ctx, channelId);
                    console.log("have connectd account", connectedAccount);
                }
                /*
                 * AT THIS POINT WE HAVE CREATED TWO NEW ORDERS AND WE HAVE ADDED THE RELEVANT PAYMENTS TO THEM.  
                 * HOWEVER THE CLIENT WILL ONLY BE MONITORING THE ORIGINAL 
                 * ORDER, SO WE NEED TO ALSO UPDATE THIS TO CLOSE IT!
                 */
                const addresult = await this.orderService.addPaymentToOrder(ctx, order.id, input);

                
            }

            // if we have a single vendor responsible for all items in this order then we need to make sure that this order is assigned to the vendor's channel
            // note we can't do this with the channelservice as the order needs to be hydrated prior to updating!
            else if (channellist.length == 1 && order?.id){
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
                
                //finally update the  payment details for this order!
                await this.orderService.transitionToState(ctx, entity.id, 'ArrangingPayment');
                await this.orderService.addPaymentToOrder(ctx, order.id, input);
            }

            //now we need to look up the products and merchants and disburse the money - do we only do this once the order has
            //been dispatched?  Think probably best to do it straight away!
        }
        return { success: true };
    }
}

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [StripeWebhookController],
    providers: [AccountConnectionService],
})
export class StripeWebhookPlugin {}
