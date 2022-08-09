import { Controller, Get, Post, Delete, Param, Redirect, Body, Query } from '@nestjs/common';
import { Ctx, PluginCommonModule, RequestContext, OrderService, VendurePlugin, Order, ProductVariant, ProductVariantService, ChannelService, TransactionalConnection, Channel, EntityHydrator, ShippingLine, ShippingMethod, ID, isGraphQlErrorResult } from '@vendure/core';
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
    constructor(@InjectStripe() private readonly stripeClient: Stripe, private orderService: OrderService, private productVariantService: ProductVariantService, private entityHydratorService: EntityHydrator,  private channelService: ChannelService, private connection: TransactionalConnection) {}
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
                }
            }
            // if we have a single vendor responsible for all items in this order then we need to make sure that this order is assigned to the vendor's channel
            // note we can't do this with the channelservice as the order needs to be hydrated prior to updating!
            else if (channellist.length == 1 && order?.id){
                const entity = await this.connection.getEntityOrThrow(ctx, Order, order.id, {relations: ['channels']}); //TODO can we not just add lines and shipping lines to this?
                                                                                                                        //and this might even then allow us to use the channelserive
                                                                                                                        //to assign the order to channels rather than doing it manually?
                const channel = await this.connection.getEntityOrThrow(ctx, Channel, channellist[0].id);
                entity.channels.push(channel);
                const hydratedentity = await this.entityHydratorService.hydrate(ctx, entity, { relations: ['lines', 'shippingLines'] })
                
                //now we need to assign the hydratedentity's shipping method to this channel if it doesn't already exist!!
                for (const shippingLine of hydratedentity.shippingLines){
                    console.log("assigning shipping lines to method!", shippingLine?.shippingMethodId);
                    if (shippingLine?.shippingMethodId){
                        await this.channelService.assignToChannels(ctx,ShippingMethod,shippingLine?.shippingMethodId, [channellist[0].id]);
                    }
                }
                //finally we can save the order!
                await this.connection.getRepository(ctx, Order).save(hydratedentity, { reload: false });

              
                const  trans = await this.orderService.transitionToState(ctx, hydratedentity.id, 'ArrangingPayment');
             
                console.log("adding payment to order", hydratedentity.id);
                const result = await this.orderService.addPaymentToOrder(ctx, order.id, input);
                console.log("done", result);
            }

            /*for (const variant of variants){
               const channels = await this.productVariantService.getProductVariantChannels(ctx, variant.id);
               const vendors = channels.filter(v=>v.code!="__default_channel__");
               
               if (order?.id && vendors.length > 0){
                const entity = await this.connection.getEntityOrThrow(ctx, Order, order.id, {
                    relations: ['channels'],
                });

                if (vendors.length == 1){
                    
                        const channel = await this.connection.getEntityOrThrow(ctx, Channel, vendors[0].id);
                        entity.channels.push(channel);
                        const _entity = await this.entityHydratorService.hydrate(ctx, entity, { relations: ['lines', 'shippingLines'] })
                        

                        console.log(_entity);
                        //now we need to assign the _entity's shipping method to this channel if it doesn't already exist!!
                        for (const shippingLine of _entity.shippingLines){
                            console.log("assigning shipping lines to method!", shippingLine?.shippingMethodId);
                            if (shippingLine?.shippingMethodId){
                                await this.channelService.assignToChannels(ctx,ShippingMethod,shippingLine?.shippingMethodId, [vendors[0].id]);
                            }
                        }

                        console.log("** now have entity **");
                        console.log(_entity);
                        await this.connection.getRepository(ctx, Order).save(_entity, { reload: false });
                    
                        
                }
                else {  //this is the multivendor case where we have to create a new set of orders for each product}
            }

            }*/
          
            //if (order) {
            //    await this.orderService.addPaymentToOrder(ctx, order.id, input);
                //think we need a service here that creates new orders based on channel ids.
            //    const _order = await this.orderService.findOne(ctx, order.id);
             //   console.log("-->ok original order", _order);
            //}
            //now we need to look up the products and merchants and disburse the money - r do we only do this once the order has
            //been dispatched?  Think probably best to do it straight away!
        }
        return { success: true };
    }
}

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [StripeWebhookController],
})
export class StripeWebhookPlugin {}
