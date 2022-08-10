import { Injectable } from '@nestjs/common';
import { Channel, ID, RequestContext, TransactionalConnection, User } from '@vendure/core';
import { AccountConnection } from '../entities/connect.entity';

@Injectable()
export class AccountConnectionService {
    constructor(private connection: TransactionalConnection) {}
    /**
     * @description
     * Returns all Channels to which the Product is assigned.
     */
    async createLink(
        ctx: RequestContext,
        channelId: ID,
        userId: ID,
        account: string,
    ): Promise<AccountConnection> {
        const channel = await this.connection.getEntityOrThrow(ctx, Channel, channelId);
        const user = await this.connection.getEntityOrThrow(ctx, User, userId);
        const accountconnection = {
            channel,
            user,
            account,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.connection.getRepository(ctx, AccountConnection).save(accountconnection);
    }

    async fetchByChannelId(ctx: RequestContext, channelId: ID) {
        return this.connection.rawConnection
            .createQueryBuilder()
            .select("connection.userId")
            .addSelect("connection.channelId")
            .addSelect("connection.account")
            .from(AccountConnection, 'connection')
            .where('connection.channelId = :channelId', { channelId: channelId })
            .getRawOne();
    }
}
