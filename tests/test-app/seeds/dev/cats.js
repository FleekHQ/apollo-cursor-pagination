const faker = require('faker');
const Cat = require('../../src/models/Cat');

exports.seed = function (knex, Promise) {
  // Deletes ALL existing entries
  return knex('cats')
    .del()
    .then(async () => {
      // Inserts seed entries
      await Cat.query().insert({
        name: faker.commerce.productName(),
        ownerId: 1,
        id: 1,
      });
      await Cat.query().insert({
        name: faker.commerce.productName(),
        ownerId: 1,
        id: 2,
      });
      await Cat.query().insert({
        name: faker.commerce.productName(),
        ownerId: 1,
        id: 3,
      });
      await Cat.query().insert({
        name: faker.commerce.productName(),
        ownerId: 2,
        id: 4,
      });
    });
};
