"use strict";

var _apolloServer = require("apollo-server");

var _schema = _interopRequireDefault(require("./schema"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import createLoaders from './loaders';
const server = new _apolloServer.ApolloServer({
  schema: _schema.default,
  formatError: error => {
    console.log(error);
    return error;
  },
  formatResponse: response => {
    console.log(response);
    return response;
  },
  engine: false,
  tracing: true,
  cacheControl: true
});
server.listen().then(({
  url
}) => {
  console.log(`🚀 Cats server ready at ${url}`);
});