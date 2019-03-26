# Apollo Cursor Pagination

Implementation of Relay's Connection specs for Apollo Server. Allows your Apollo Server to do cursor-based pagination. It can connect to any ORM, but only the connection with Knex.js is implemented currently.

## Installation

`yarn add apollo-cursor-pagination`

## Usage

### Using an existing connector

Use the `paginate` function of the connector in your GraphQL resolver.

`paginate` receives the following arguments:

1- `nodesAccessor`: An object that can be queried or accessed to obtain a reduced result set.

2- `args`: GraphQL args for your connection. Can have the following fields: `first`, `last`, `before`, `after`.

3- `orderArgs`: If using a connector with stable cursor, you must indicate to `paginate` how are you sorting your query. Must contain `orderColumn` (which attribute you are ordering by) and `ascOrDesc` (which can be `asc` or `desc`). Note: apollo-cursor-pagination does not sort your query, you must do it yourself before calling `paginate`.

For example with the knex connector:

```javascript
// cats-connection.js
import { knexPaginator as paginate } from 'apollo-cursor-pagination/orm-connectors/knex';
import knex from '../../../db'; // Or instantiate a connection here

export default async (_, args) => {
  // orderBy must be the column to sort with or an array of columns for ordering by multiple fields
  // orderDirection must be 'asc' or 'desc', or an array of those values if ordering by multiples
  const {
    first, last, before, after, orderBy, orderDirection,
  } = args;

  const baseQuery = knex('cats');

  const result = await paginate(baseQuery, {first, last, before, after, orderBy, orderDirection});
  /* result will contain:
  * edges
  * totalCount
  * pageInfo { hasPreviousPage, hasNextPage, }
  */
  return result;
};
```

### Creating your own connector

Only Knex.js is implemented for now. If you want to connect to a different ORM, you must make your own connector.

To create your own connector:

1- Import `apolloCursorPaginationBuilder` from `src/builder/index.js`

2- Call `apolloCursorPaginationBuilder` with the specified params. It will generate a `paginate` function that you can export to use in your resolvers.

You can base off from `src/orm-connectors/knex/custom-pagination.js`.

## Contributing

Pull requests are welcome, specially to implement new connectors for different ORMs / Query builders.

When submitting a pull request, please include tests for the code you are submitting, and check that you did not break any working test.

### Testing and publishing changes

1- Code your changes

2- Run `yarn build`. This will generate a `dist` folder with the distributable files

3- `cd` into the test app and run `yarn install` and then `yarn test`. Check that all tests pass.

4- Send the PR. When accepted, the maintainer will publish a new version to npm using the new `dist` folder.

### Running the test suite

1- `cd tests/test-app`

2- `yarn install`

3- `yarn test`