/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeepPartial, VendureEntity, Channel, User } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class AccountConnection extends VendureEntity {
    constructor(input?: DeepPartial<AccountConnection>) {
        super(input);
    }

    @ManyToOne(type => User)
    user: User;

    @ManyToOne(type => Channel)
    channel: Channel;

    @Column()
    account: string;
}
