import { Controller, Get, Post, Delete, Param, Redirect, Body, Query } from '@nestjs/common';
import {
    Ctx,
    PluginCommonModule,
    ProductService,
    RequestContext,
    OrderService,
    VendurePlugin,
} from '@vendure/core';
import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';

export class OrderParam {
    orderId: string;
}

@Controller('create-payment-intent')
export class PaymentIntentController {
    constructor(@InjectStripe() private readonly stripeClient: Stripe, private orderService: OrderService) {}

    //pull out query (orderId) here and then pass back chcekout data
    @Post()
    async paymentIntent(@Body() param: OrderParam, @Ctx() ctx: RequestContext) {
        console.log('have body', param);
        const { orderId = '' } = param;
        const order = await this.orderService.findOneByCode(ctx, orderId);
        const params: Stripe.PaymentIntentCreateParams = {
            payment_method_types: ['card'],
            amount: order?.totalWithTax || 0,
            capture_method: 'automatic',
            currency: 'gbp',
            description: process.env.STRIPE_PAYMENT_DESCRIPTION ?? '',
            metadata: {
                reference: orderId,
            },
        };
        console.log('created payment intent for order id', orderId);
        const payment_intent: Stripe.PaymentIntent = await this.stripeClient.paymentIntents.create(params);
        const { client_secret: token } = payment_intent;
        console.log('returning token!!', token);
        return { token };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const deleted = await this.stripeClient.accounts.del(id);
        return { deleted };
    }
}

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [PaymentIntentController],
})
export class PaymentIntentPlugin {}
