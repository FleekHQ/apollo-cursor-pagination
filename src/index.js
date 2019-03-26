const apolloConnectionBuilder = require('./builder');
const knexPaginator = require('./orm-connectors/knex');

module.exports = {
  apolloConnectionBuilder,
  knexPaginator,
};
