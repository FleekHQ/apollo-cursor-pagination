"use strict";

const glob = require('glob');

const path = require('path');

const {
  merge
} = require('lodash');

const {
  makeExecutableSchema
} = require('graphql-tools');

const Root =
/* GraphQL */
`
  type Query {
    dummy: String
  }
  type Mutation {
    dummy: String
  }
  type Subscription {
    dummy: String
  }
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
const queriesToMerge = [];
const mutationsToMerge = []; // Iterate over each folder in the queries folder
// to then add the index file to the resolver list.

glob.sync(path.join(__dirname, '/queries/*/index.js')).forEach(file => {
  const query = require(path.resolve(file));

  queriesToMerge.push(query);
}); // Iterate over each folder in the mutations folder
// to then add the index file to the resolver list.

glob.sync(path.join(__dirname, '/mutations/*/index.js')).forEach(file => {
  const mutation = require(path.resolve(file));

  mutationsToMerge.push(mutation);
});
const resolvers = merge({}, ...queriesToMerge, ...mutationsToMerge); // Iterate over each type file in the types folder, and load into the typeDefs array

const typeDefs = [Root];
glob.sync(path.join(__dirname, '/type-defs/*.js')).forEach(file => {
  const type = require(path.resolve(file));

  typeDefs.push(type);
});
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});
module.exports = schema;