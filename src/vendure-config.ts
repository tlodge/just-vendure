import {
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    dummyPaymentHandler,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';

import fs from 'fs';
import { ReviewsPlugin } from './plugins/reviews/reviews-plugin';
import { ConnectPlugin } from './plugins/marketplace/src/connect';
import { PaymentIntentPlugin } from './plugins/marketplace/src/create_payment_intent';
import { StripeWebhookPlugin } from './plugins/marketplace/src/stripe_webhooks';
import { customAdminUi } from './compile-admin-ui';
import { NewVendorPlugin } from './plugins/vendors/NewVendorPlugin';

const IS_PROD = path.basename(__dirname) === 'dist';

export const config: VendureConfig = {
    apiOptions: {
        port: 3000,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        adminApiPlayground: {
            settings: { 'request.credentials': 'include' },
        },
        adminApiDebug: true,
        shopApiPlayground: {
            settings: { 'request.credentials': 'include' },
        },
        shopApiDebug: true,
    },
    authOptions: {
        disableAuth: false,
        tokenMethod: ['bearer', 'cookie'] as const,
        requireVerification: true,
        customPermissions: [],
        cookieOptions: {
            secret: 'abc',
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        username: 'postgres',
        password: 'f1o8ting',
        database: 'vendure',
        synchronize: true
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
        }),
        DefaultSearchPlugin,
        DefaultJobQueuePlugin,
        EmailPlugin.init({
            route: 'mailbox',
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change',
            },
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
            app: customAdminUi({ recompile: !IS_PROD, devMode: !IS_PROD }),
            adminUiConfig: {
                tokenMethod: 'bearer',
            },
        }),
        ConnectPlugin,
        PaymentIntentPlugin,
        StripeWebhookPlugin,
        ReviewsPlugin,
        NewVendorPlugin
    ],
};

function getMigrationsPath() {
    const devMigrationsPath = path.join(__dirname, '../migrations');
    const distMigrationsPath = path.join(__dirname, 'migrations');

    return fs.existsSync(distMigrationsPath)
        ? path.join(distMigrationsPath, '*.js')
        : path.join(devMigrationsPath, '*.ts');
}
