import { Args, Mutation, Parent, ResolveField, Resolver, Query } from '@nestjs/graphql';

import {
    Ctx,
    ListQueryBuilder,
    Order,
    RequestContext,
    Transaction,
    TransactionalConnection,
} from '@vendure/core';

import { SubAccount } from '../entities/subaccount.entity';
import {
    MutationInsertSubAccountArgs,
    QuerySubAccountArgs,
    QuerySubAccountsArgs,
} from './sub-api-extensions';

@Resolver('SubAccount')
export class SubAccountEntityResolver {
    constructor(private connection: TransactionalConnection, private listQueryBuilder: ListQueryBuilder) {}

    @Transaction()
    @Mutation()
    async insertSubAccount(
        @Ctx() ctx: RequestContext,
        @Args() { input }: MutationInsertSubAccountArgs,
    ) {
        const accountconnection = new SubAccount(input);
        const parent = await this.connection.getEntityOrThrow(ctx, Order, input.parentId);
        const child = await this.connection.getEntityOrThrow(ctx, Order, input.childId);
        accountconnection.parent = parent;
        accountconnection.child = child;
        accountconnection.createdAt = new Date();
        accountconnection.updatedAt = new Date();
        return this.connection.getRepository(ctx, SubAccount).save(accountconnection);
    }

    @Query()
    async subAccounts(@Ctx() ctx: RequestContext, @Args() args: QuerySubAccountsArgs) {
        return this.listQueryBuilder
            .build(SubAccount, args.options || undefined, {
                relations: ['order', 'order'],
                ctx,
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    @Query()
    async subAccount(@Ctx() ctx: RequestContext, @Args() args: QuerySubAccountArgs) {
        return this.connection.getRepository(ctx, SubAccount).findOne(args.id, {
            relations: ['order', 'order'],
        });
    }
    @ResolveField()
    async parent(@Parent() subaccount: SubAccount, @Ctx() ctx: RequestContext) {
        let parent: Order | null = subaccount.parent;

        const _subaccount = await this.connection
            .getRepository(ctx, SubAccount)
            .findOne(subaccount.id, {
                relations: ['order'],
            });

        if (_subaccount) {
            parent = _subaccount.parent;
        }
        if (parent) {
            return parent;
        }
    }

    @ResolveField()
    async child(@Parent() subaccount: SubAccount, @Ctx() ctx: RequestContext) {
        let child: Order | null = subaccount.child;
        const _subaccount = await this.connection
            .getRepository(ctx, SubAccount)
            .findOne(subaccount.id, {
                relations: ['order'],
            });

        if (_subaccount) {
            child = _subaccount.child;
        }
        return child;
    }
}
