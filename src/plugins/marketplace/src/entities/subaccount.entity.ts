/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeepPartial, VendureEntity, Order } from '@vendure/core';
import { Entity, ManyToOne } from 'typeorm';

@Entity()
export class SubAccount extends VendureEntity {
    constructor(input?: DeepPartial<SubAccount>) {
        super(input);
    }

    @ManyToOne(type => Order)
    parent: Order;

    @ManyToOne(type => Order)
    child: Order;
}
