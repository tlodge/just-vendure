import { Injectable } from '@nestjs/common';
import { Order, ID, RequestContext, TransactionalConnection} from '@vendure/core';
import { SubAccount } from '../entities/subaccount.entity';

@Injectable()
export class SubAccountService {
    constructor(private connection: TransactionalConnection) {}
    /**
     * @description
     * Returns all Channels to which the Product is assigned.
     */
    async createLink(
        ctx: RequestContext,
        parentId: ID,
        childId: ID,
    ): Promise<SubAccount> {
        const parent = await this.connection.getEntityOrThrow(ctx, Order, parentId);
        const child = await this.connection.getEntityOrThrow(ctx, Order, childId);
        const subaccount = {
            parent,
            child,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.connection.getRepository(ctx, SubAccount).save(subaccount);
    }

    async fetchByParentId(ctx: RequestContext, parentId: ID) {
        return this.connection.rawConnection
            .createQueryBuilder()
            .select("connection.parentId", "parentId")
            .addSelect("connection.childId", "childId")
            .from(SubAccount, 'connection')
            .where('connection.parentId = :parentId', { parentId: parentId })
            .getRawMany()
    }
}
