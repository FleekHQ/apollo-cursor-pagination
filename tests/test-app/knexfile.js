// Update with your config settings.

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3',
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds/dev',
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: './test.sqlite3',
    },
    migrations: {
      table_name: 'knex_migrations',
    },
    seeds: {
      directory: './seeds/test',
    },
  },
};
