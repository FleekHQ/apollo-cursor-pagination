const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const request = require('request-promise');
const schema = require('../../src/schema');

const start = (done, appPort) => {
  const PORT = appPort || 4000;
  const server = new ApolloServer({
    schema,
  });

  const app = express();

  server.applyMiddleware({ app });
  return app.listen(PORT, () => done());
};

const stop = async (app, done) => {
  await app.close();
  done();
};

const graphqlQuery = (app, query) => request({
  baseUrl: `http://localhost:${app.address().port}`,
  uri: '/graphql',
  qs: {
    query,
  },
  resolveWithFullResponse: true,
  json: true,
});

module.exports = {
  start,
  stop,
  graphqlQuery,
};
