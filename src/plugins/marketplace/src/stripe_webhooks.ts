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
    constructor(@InjectStripe() private readonly stripeClient: Stripe, 
                                private orderService: OrderService, 
                                private accountConnectionService: AccountConnectionService, 
                                private productVariantService: ProductVariantService,  
                                private channelService: ChannelService, 
                                private connection: TransactionalConnection) {}
    @Post()
    async stripeWebhook(@Body() param: any, @Ctx() ctx: RequestContext) {
      
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
            await this.orderService.addPaymentToOrder(ctx, order?.id || -1, input);

            //so at this point we need to update the state of this order's sub-orders!
            //so these need to be recorded in when the payment intent is created!

             /*const result = await this.orderService.addPaymentToOrder(ctx, neworder.id, input);
                
                if (!isGraphQlErrorResult(result)) { //guard to stop typescript complaining!
                    console.log(result.code);
                    console.log("subtotal", result.subTotalWithTax);
                    console.log("shipping", result.shippingWithTax);
                    console.log("vendor price is", vendorprice);
                }
                console.log("--------------------------");
                */


            
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
