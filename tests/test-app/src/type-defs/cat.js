const Cat = `
  type Cat {
    id: ID!
    name: String
  }

  type CatsConnection {
    pageInfo: PageInfo!
    edges: [CatEdge]!
  }

  type CatEdge {
    cursor: String!
    node: Cat!
  }

  extend type Query {
    catsConnection(
      first: Int
      after: String
      last: Int
      before: String
    ): CatsConnection!
  }
`;

module.exports = Cat;
