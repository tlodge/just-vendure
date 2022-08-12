import { Controller, Post, Body, } from '@nestjs/common';
import { Ctx, PluginCommonModule, RequestContext, OrderService, VendurePlugin, ProductVariantService, ChannelService, TransactionalConnection, isGraphQlErrorResult } from '@vendure/core';
import { AccountConnectionService } from './services/AccountConnectionService';
import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';
import { SubAccountService } from './services/SubAccountService';

//This is called by stripe once the order has gone through and it will update the order
//To show that it is complete.  It then needs

@Controller('stripe-webhook')
export class StripeWebhookController {
    constructor(@InjectStripe() private readonly stripeClient: Stripe, 
                                private orderService: OrderService, 
                                private accountConnectionService: AccountConnectionService, 
                                private subAccountService : SubAccountService,
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


            console.log("---------- webhooks have order -----------");
            console.log(order);
            console.log("---------------------------------");            

            console.log("adding payment to order");
            const success = await this.orderService.addPaymentToOrder(ctx, order?.id || -1, input);

            if (!isGraphQlErrorResult(success)) { 
                console.log("successfully updated payment to order ", order?.id);
            }else{
                console.log("error");
                console.log(success);
            }

            const subaccounts = await this.subAccountService.fetchByParentId(ctx, order?.id || -1);

            console.log("have subaccounts!!", subaccounts)
            
            for (const subaccount of subaccounts){
                const result = await this.orderService.addPaymentToOrder(ctx, subaccount.childId, input);
                console.log("have subaccount", subaccount);
                if (!isGraphQlErrorResult(result)) { //guard to stop typescript complaining!
                    console.log(result.code);
                    console.log("subtotal", result.subTotalWithTax);
                    console.log("shipping", result.shippingWithTax);
                }else{
                    console.log(result);
                }
            }
        }
        return { success: true };
    }
}

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [StripeWebhookController],
    providers: [AccountConnectionService, SubAccountService]
})
export class StripeWebhookPlugin {}
