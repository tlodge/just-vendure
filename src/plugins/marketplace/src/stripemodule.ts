import { Module } from '@nestjs/common';

import { StripeModule } from 'nestjs-stripe';
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys

@Module({
    imports: [
        StripeModule.forRoot({
            apiKey: 'sk_test_51HJyEEI4XNUIMuQtV3LnGw8AGu0RcRirAxzt5yTFAvFYtuNkhp7Gcc6jBnRnghYvFYRR41k6UK7IFJYz1pGiJO0O00Fvn9wk96',
            apiVersion: '2020-08-27',
        }),
    ],
})
export class AppStripeModule {}