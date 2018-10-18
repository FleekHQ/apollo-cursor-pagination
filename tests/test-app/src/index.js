import { ApolloServer } from 'apollo-server';
// import createLoaders from './loaders';
import schema from './schema';

const server = new ApolloServer({
  schema,
  formatError: (error) => {
    console.log(error);
    return error;
  },
  formatResponse: (response) => {
    console.log(response);
    return response;
  },
  engine: false,
  tracing: true,
  cacheControl: true,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Cats server ready at ${url}`);
});
