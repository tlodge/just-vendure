import { DateOperators, NumberOperators, Scalars, SortOrder, StringOperators } from '@vendure/core';
import { gql } from 'apollo-server-core';
export type Maybe<T> = T;
export enum LogicalOperator {
    AND = 'AND',
    OR = 'OR',
}
export const commonApiExtensions = gql`
    type SubAccount implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        parent: Order!
        child: Order!
    }

    type SubAccountList implements PaginatedList {
        items: [SubAccount!]!
        totalItems: Int!
    }
    # Auto-generated at runtime
    input SubAccountListOptions
`;

export const adminApiExtensions = gql`
    ${commonApiExtensions}

    input SubAccountInput {
        id: ID!
        parentId: ID!
        childId: ID!
    }

    extend type Query {
        subAccounts(options: SubAccountListOptions): SubAccountList!
        subAccount(id: ID!): SubAccount
    }

    extend type Mutation {
        insertSubAccount(input: SubAccountInput!): SubAccount!
    }
`;

export type InsertSubAccountInput = {
    id: Scalars['ID'];
    parentId: Scalars['ID'];
    childId: Scalars['ID'];
};

export type MutationInsertSubAccountArgs = {
    input: InsertSubAccountInput;
};

export type QuerySubAccountsArgs = {
    options?: Maybe<SubAccountListOptions>;
};

export type QuerySubAccountArgs = {
    id: Scalars['ID'];
};

export type SubAccountListOptions = {
    /** Skips the first n results, for use in pagination */
    skip?: Maybe<Scalars['Int']>;
    /** Takes n results, for use in pagination */
    take?: Maybe<Scalars['Int']>;
    /** Specifies which properties to sort the results by */
    sort?: Maybe<SubAccountSortParameter>;
    /** Allows the results to be filtered */
    filter?: Maybe<SubAccountFilterParameter>;
    /** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
    filterOperator?: Maybe<LogicalOperator>;
};

export type SubAccountSortParameter = {
    id?: Maybe<SortOrder>;
    createdAt?: Maybe<SortOrder>;
    updatedAt?: Maybe<SortOrder>;
    parentId?: Maybe<SortOrder>;
    childId?: Maybe<SortOrder>;
};

export type SubAccountFilterParameter = {
    createdAt?: Maybe<DateOperators>;
    updatedAt?: Maybe<DateOperators>;
    parentId?: Maybe<NumberOperators>;
    childId?: Maybe<NumberOperators>;
};
