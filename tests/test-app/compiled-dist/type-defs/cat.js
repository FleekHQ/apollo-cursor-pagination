"use strict";

const Cat = `
  type Cat {
    id: ID!
    name: String
    lastName: String
  }

  type CatsConnection {
    pageInfo: PageInfo!
    edges: [CatEdge]!
    totalCount: Int!
  }

  type CatEdge {
    cursor: String!
    node: Cat!
  }

  enum OrderDirection {
    asc
    desc
  }

  extend type Query {
    catsConnection(
      first: Int
      after: String
      last: Int
      before: String
      orderBy: String
      orderDirection: OrderDirection
      orderDirectionMultiple: [OrderDirection]
      orderByMultiple: [String!]
    ): CatsConnection!
  }
`;
module.exports = Cat;