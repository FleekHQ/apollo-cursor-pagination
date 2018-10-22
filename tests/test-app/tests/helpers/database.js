const knexCleaner = require('knex-cleaner');
const knex = require('../../src/models/db');

// TODO @dmerrill6: configure with this: https://jestjs.io/docs/en/configuration.html#testenvironment-string
// It is very ugly to just import this module so it gets ran before tests.

beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw 'Tests can only run in test environment';
  }
  try {
    await knex.migrate.latest();
  } catch (e) {
    console.log(
      "WARN: test database already migrated. Some Knex warnings will pop up but it's expected",
    );
  }
});

afterAll(() => knex.destroy());

beforeEach(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw 'Tests can only run in test environment';
  }
  await knexCleaner.clean(knex);
});
