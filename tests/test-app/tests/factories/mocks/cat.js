import faker from 'faker';
import Cat from '../../../src/models/Cat';

module.exports = {
  model: Cat,
  className: 'Cat',
  mockFn: () => ({
    name: faker.commerce.productName(),
    lastName: faker.commerce.productName(),
  }),
};
