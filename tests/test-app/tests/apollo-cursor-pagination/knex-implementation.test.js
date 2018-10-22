const _ = require('../helpers/database'); // eslint-disable-line no-unused-vars
const { start, stop, graphqlQuery } = require('../helpers/integration-server');
const catFactory = require('../factories/mocks/cat');

describe('getCatsByOwner root query', () => {
  let app;
  let cat1;
  let cat2;
  let cat3;
  // TODO @dmerrill6: extract this into a helper fn.
  beforeAll((done) => {
    app = start(done);
  });
  afterAll((done) => {
    stop(app, done);
  });

  beforeEach(async () => {
    cat1 = await catFactory.model
      .query()
      .insert({ ...catFactory.mockFn(), id: 1 });
    cat2 = await catFactory.model
      .query()
      .insert({ ...catFactory.mockFn(), id: 2 });
    cat3 = await catFactory.model
      .query()
      .insert({ ...catFactory.mockFn(), id: 3 });
  });

  describe('forward pagination', () => {
    let cursor;

    it('brings first 2 cats correctly', async () => {
      const query = `
        {
          catsConnection(first: 2) {
            edges {
              cursor
              node {
                name
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat1.name, cat2.name]);
      cursor = response.body.data.catsConnection.edges[0].cursor;
    });

    it('brings first 2 cats after the first correctly', async () => {
      const query = `
        {
          catsConnection(first: 2, after: "${cursor}") {
            edges {
              cursor
              node {
                name
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat2.name, cat3.name]);
    });

    it('brings page info correctly', async () => {
      const query = `
        {
          catsConnection(first: 2) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.pageInfo.hasNextPage).toEqual(true);
    });

    it('brings page info when there are no remaining pages correctly', async () => {
      const query = `
        {
          catsConnection(first: 3) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.pageInfo.hasNextPage).toEqual(false);
    });
  });

  describe('backwards pagination', () => {
    let cursor;

    it('brings last 2 cats correctly', async () => {
      const query = `
        {
          catsConnection(last: 2) {
            edges {
              cursor
              node {
                name
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat2.name, cat3.name]);
      cursor = response.body.data.catsConnection.edges[1].cursor;
    });

    it('brings last 2 cats before the first correctly', async () => {
      const query = `
        {
          catsConnection(last: 2, before: "${cursor}") {
            edges {
              cursor
              node {
                name
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat1.name, cat2.name]);
    });

    it('brings page info correctly', async () => {
      const query = `
        {
          catsConnection(last: 2) {
            pageInfo {
              hasPreviousPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.pageInfo.hasPreviousPage).toEqual(true);
    });

    it('brings page info when there are no remaining pages correctly', async () => {
      const query = `
        {
          catsConnection(last: 3) {
            pageInfo {
              hasPreviousPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.data.catsConnection.pageInfo.hasPreviousPage).toEqual(false);
    });
  });

  describe('cursor stability', () => {
    it('remains stable after adding an element to the list', async () => {
      const query = `
        {
          catsConnection(first: 3) {
            edges {
              cursor
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      const cursor = response.body.data.catsConnection.edges[0].cursor;
      cat1 = await catFactory.model
        .query()
        .insert({ ...catFactory.mockFn(), id: 0 });
      const query2 = `
        {
          catsConnection(first: 3) {
            edges {
              cursor
            }
          }
        }
      `;
      const response2 = await graphqlQuery(app, query2);
      const newCursor = response2.body.data.catsConnection.edges[1].cursor;
      expect(cursor).toEqual(newCursor);
    });
  });
});
