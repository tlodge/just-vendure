import { Controller, Get, Post, Delete, Param, Redirect, Body, Query } from '@nestjs/common';
import { Ctx, PluginCommonModule, RequestContext, OrderService, VendurePlugin, Order, ProductVariant, ProductVariantService, ChannelService, TransactionalConnection, Channel, EntityHydrator, ShippingLine, ShippingMethod } from '@vendure/core';
import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';

//This is called by stripe once the order has gone through and it will update the order
//To show that it is complete.  It then needs
@Controller('stripe-webhook')
export class StripeWebhookController {
    constructor(@InjectStripe() private readonly stripeClient: Stripe, private orderService: OrderService, private productVariantService: ProductVariantService, private entityHydratorService: EntityHydrator,  private channelService: ChannelService, private connection: TransactionalConnection) {}
    @Post()
    async stripeWebhook(@Body() param: any, @Ctx() ctx: RequestContext) {
        console.log(param.type);

        if (param.type === 'charge.succeeded') {
            console.log("seen a charge succeeded!");
            const { data } = param;
            console.log(data);

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
            


           const {lines} = order as Order;
           
           const variants:ProductVariant[]  = lines.map(l=>l.productVariant);

            console.log("have variatnts");
            console.log(variants);

            for (const variant of variants){
               const channels = await this.productVariantService.getProductVariantChannels(ctx, variant.id);
               const vendors = channels.filter(v=>v.code!="__default_channel__");
               if (vendors.length == 1 && order?.id){
                   
                
                    const entity = await this.connection.getEntityOrThrow(ctx, Order, order.id, {
                        relations: ['channels'],
                    });
            
                   
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
               //create new channels if length > 1
            }
          
            if (order) {
                await this.orderService.addPaymentToOrder(ctx, order.id, input);
                //think we need a service here that creates new orders based on channel ids.
            }

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
