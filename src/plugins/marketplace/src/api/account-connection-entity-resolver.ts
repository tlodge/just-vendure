import { Args, Mutation, Parent, ResolveField, Resolver, Query } from '@nestjs/graphql';

import {
    Channel,
    Ctx,
    ListQueryBuilder,
    RequestContext,
    Transaction,
    TransactionalConnection,
    User,
} from '@vendure/core';

import { AccountConnection } from '../entities/connect.entity';
import {
    MutationInsertAccountConnectionArgs,
    QueryAccountConnectionArgs,
    QueryAccountConnectionsArgs,
} from './api-extensions';

@Resolver('AccountConnection')
export class AccountConnectionEntityResolver {
    constructor(private connection: TransactionalConnection, private listQueryBuilder: ListQueryBuilder) {}

    @Transaction()
    @Mutation()
    async insertAccountConnection(
        @Ctx() ctx: RequestContext,
        @Args() { input }: MutationInsertAccountConnectionArgs,
    ) {
        const accountconnection = new AccountConnection(input);
        const channel = await this.connection.getEntityOrThrow(ctx, Channel, input.channelId);
        const user = await this.connection.getEntityOrThrow(ctx, User, input.userId);
        accountconnection.channel = channel;
        accountconnection.user = user;
        accountconnection.createdAt = new Date();
        accountconnection.updatedAt = new Date();
        return this.connection.getRepository(ctx, AccountConnection).save(accountconnection);
    }

    @Query()
    async accountConnections(@Ctx() ctx: RequestContext, @Args() args: QueryAccountConnectionsArgs) {
        return this.listQueryBuilder
            .build(AccountConnection, args.options || undefined, {
                relations: ['channel', 'user'],
                ctx,
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    @Query()
    async accountConnection(@Ctx() ctx: RequestContext, @Args() args: QueryAccountConnectionArgs) {
        return this.connection.getRepository(ctx, AccountConnection).findOne(args.id, {
            relations: ['channel', 'user'],
        });
    }
    @ResolveField()
    async channel(@Parent() accountconnection: AccountConnection, @Ctx() ctx: RequestContext) {
        let channel: Channel | null = accountconnection.channel;

        const account = await this.connection
            .getRepository(ctx, AccountConnection)
            .findOne(accountconnection.id, {
                relations: ['channel'],
            });

        if (account) {
            channel = account.channel;
        }
        if (channel) {
            return channel;
        }
    }

    @ResolveField()
    async user(@Parent() accountconnection: AccountConnection, @Ctx() ctx: RequestContext) {
        let user: User | null = accountconnection.user;
        const account = await this.connection
            .getRepository(ctx, AccountConnection)
            .findOne(accountconnection.id, {
                relations: ['user'],
            });

        if (account) {
            user = account.user;
        }
        return user;
    }
}
