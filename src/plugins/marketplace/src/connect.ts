import { Controller, Post, Delete, Param } from '@nestjs/common';
import {
    Ctx,
    PluginCommonModule,
    RequestContext,
    VendurePlugin,
    UserService,
    Channel,
    Role,
} from '@vendure/core';
import { AppStripeModule } from './stripemodule';

import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';
import { AccountConnection } from './entities/connect.entity';
import { adminApiExtensions } from './api/api-extensions';
import { AccountConnectionEntityResolver } from './api/account-connection-entity-resolver';
import { AccountConnectionService } from './services/AccountConnectionService';

@Controller('connect')
export class ConnectController {
    constructor(
        @InjectStripe() private readonly stripeClient: Stripe,
        private accountConnectionService: AccountConnectionService,
        private userService: UserService,
    ) {}

    /* This creates a db entry for a stripe connect link (user, channel, connection url)
    which will then be used to disburse payments to vendors when one of their items has
    been purchased on the store, called by the ui-extensions react app!*/
    @Post()
    async create(@Ctx() ctx: RequestContext) {
       
        let id;
        const connectedaccount = await this.accountConnectionService.fetchByUserId(ctx, ctx.activeUserId || -1);
        
        if (connectedaccount){
            console.log("have connected account", connectedaccount);
            id = connectedaccount.id;
        }
        else{
            console.log("generating new connected account!");
            const account = await this.stripeClient.accounts.create({ type: 'express' });
            id  = account.id;

            const user = await this.userService.getUserById(ctx, ctx.activeUserId || 1);
             //strip out the non-default channel that this user is assigned to.
            const channels = (user?.roles || []).reduce((acc: Channel[], role: Role) => {
                return [...acc, ...role.channels.filter((c: Channel) => c.id !== 1)];
            }, [] as Channel[]);

            if (user && user.id && channels.length > 0) {
                console.log('creating link!!', channels[0].id, user.id, id);
                this.accountConnectionService.createLink(ctx, channels[0].id, user.id, id);
            }else{
                console.log("this user doesn't have a channel!")
            }
        }

        console.log("creating connected account link for id", id);

        const accountLink = await this.stripeClient.accountLinks.create({
            account: id,
            refresh_url: 'http://127.0.0.1:3000/admin/',
            return_url: 'http://127.0.0.1:3000/admin/',
            type: 'account_onboarding',
        });

        return { link: accountLink };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const deleted = await this.stripeClient.accounts.del(id);
        return { deleted };
    }
}

@VendurePlugin({
    imports: [PluginCommonModule, AppStripeModule],
    controllers: [ConnectController],
    providers: [AccountConnectionService],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [AccountConnectionEntityResolver],
    },
    entities: [AccountConnection],
})
export class ConnectPlugin {}
