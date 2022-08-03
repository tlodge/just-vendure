import { DateOperators, NumberOperators, Scalars, SortOrder, StringOperators } from '@vendure/core';
import { gql } from 'apollo-server-core';
export type Maybe<T> = T;
export enum LogicalOperator {
    AND = 'AND',
    OR = 'OR',
}
export const commonApiExtensions = gql`
    type AccountConnection implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        channel: Channel!
        user: User!
        account: String!
    }

    type AccountConnectionList implements PaginatedList {
        items: [AccountConnection!]!
        totalItems: Int!
    }
    # Auto-generated at runtime
    input AccountConnectionListOptions
`;

export const adminApiExtensions = gql`
    ${commonApiExtensions}

    input AccountConnectionInput {
        id: ID!
        channelId: ID!
        userId: ID!
        account: String!
    }

    extend type Query {
        accountConnections(options: AccountConnectionListOptions): AccountConnectionList!
        accountConnection(id: ID!): AccountConnection
    }

    extend type Mutation {
        insertAccountConnection(input: AccountConnectionInput!): AccountConnection!
    }
`;

export type InsertAccountConnectonInput = {
    id: Scalars['ID'];
    channelId: Scalars['ID'];
    userId: Scalars['ID'];
    account: Scalars['String'];
};

export type MutationInsertAccountConnectionArgs = {
    input: InsertAccountConnectonInput;
};

export type QueryAccountConnectionsArgs = {
    options?: Maybe<AccountConnectionListOptions>;
};

export type QueryAccountConnectionArgs = {
    id: Scalars['ID'];
};

export type AccountConnectionListOptions = {
    /** Skips the first n results, for use in pagination */
    skip?: Maybe<Scalars['Int']>;
    /** Takes n results, for use in pagination */
    take?: Maybe<Scalars['Int']>;
    /** Specifies which properties to sort the results by */
    sort?: Maybe<AccountConnectionSortParameter>;
    /** Allows the results to be filtered */
    filter?: Maybe<AccountConnectionFilterParameter>;
    /** Specifies whether multiple "filter" arguments should be combines with a logical AND or OR operation. Defaults to AND. */
    filterOperator?: Maybe<LogicalOperator>;
};

export type AccountConnectionSortParameter = {
    id?: Maybe<SortOrder>;
    createdAt?: Maybe<SortOrder>;
    updatedAt?: Maybe<SortOrder>;
    account?: Maybe<SortOrder>;
    userId?: Maybe<SortOrder>;
};

export type AccountConnectionFilterParameter = {
    createdAt?: Maybe<DateOperators>;
    updatedAt?: Maybe<DateOperators>;
    account?: Maybe<StringOperators>;
    userId?: Maybe<NumberOperators>;
    channelId?: Maybe<NumberOperators>;
};
