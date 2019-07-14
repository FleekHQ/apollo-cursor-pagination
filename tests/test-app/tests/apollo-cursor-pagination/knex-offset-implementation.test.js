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
          catsConnection(useOffsetPagination: true, first: 2) {
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
      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat1.name, cat2.name]);
      cursor = response.body.data.catsConnection.edges[0].cursor;
    });

    it('brings first 2 cats after the first correctly', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2, after: "${cursor}") {
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
      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.edges).toHaveLength(2);
      expect(response.body.data.catsConnection.edges.map(edge => edge.node.name))
        .toEqual([cat2.name, cat3.name]);
    });

    it('brings page info correctly', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.pageInfo.hasNextPage).toEqual(true);
    });

    it('brings page info when there are no remaining pages correctly', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 3) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);
      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.pageInfo.hasNextPage).toEqual(false);
    });
  });


  describe('sorting', () => {
    it('sorts asc and desc correctly by id', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 3, orderBy: "id", orderDirection: asc) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat1, cat2, cat3].map(c => c.id).sort().map(id => id.toString()),
      );

      const query2 = `
        {
          catsConnection(useOffsetPagination: true, first: 3, orderBy: "id", orderDirection: desc) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response2 = await graphqlQuery(app, query2);

      expect(response2.body.errors).not.toBeDefined();
      expect(response2.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat1, cat2, cat3].map(c => c.id).sort().reverse().map(id => id.toString()),
      );
    });

    it('can sort by aggregate value', async () => {
      let cursor;
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2, orderBy: "idsum", orderDirection: asc) {
            totalCount
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toEqual(3);
      expect(response.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat1, cat2].map(c => c.id).map(id => id.toString()),
      );

      cursor = response.body.data.catsConnection.edges[1].cursor;

      const query2 = `
        {
          catsConnection(useOffsetPagination: true, first: 1, after: "${cursor}", orderBy: "idsum", orderDirection: asc) {
            totalCount
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response2 = await graphqlQuery(app, query2);

      expect(response2.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toEqual(3);
      expect(response2.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat3].map(c => c.id.toString()),
      );
    });

    it('sorts asc and desc correctly when result set is segmented', async () => {
      let cursor;
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2, orderBy: "id", orderDirection: desc) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat3, cat2].map(c => c.id).map(id => id.toString()),
      );

      cursor = response.body.data.catsConnection.edges[1].cursor;

      const query2 = `
        {
          catsConnection(useOffsetPagination: true, first: 1, after: "${cursor}", orderBy: "id", orderDirection: desc) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response2 = await graphqlQuery(app, query2);

      expect(response2.body.errors).not.toBeDefined();
      expect(response2.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat1].map(c => c.id.toString()),
      );
    });

    it('sorts correctly when sorting by a non unique column and it gets segmentated', async () => {
      await catFactory.model.query().del();
      cat1 = await catFactory.model
        .query()
        .insert({ ...catFactory.mockFn(), id: 1, name: 'Keyboard Cat 2' });
      cat2 = await catFactory.model
        .query()
        .insert({ ...catFactory.mockFn(), id: 2, name: 'Keyboard Cat 3' });
      cat3 = await catFactory.model
        .query()
        .insert({ ...catFactory.mockFn(), id: 3, name: 'Keyboard Cat 2' });
      const cat4 = await catFactory.model
        .query()
        .insert({ ...catFactory.mockFn(), id: 4, name: 'Keyboard Cat 1' });

      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2, orderBy: "name", orderDirection: asc) {
            totalCount
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toEqual(4);
      expect(response.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat4, cat1].map(c => c.id).map(id => id.toString()),
      );

      const cursor = response.body.data.catsConnection.edges[1].cursor;

      const query2 = `
        {
          catsConnection(useOffsetPagination: true, first: 2, after: "${cursor}", orderBy: "name", orderDirection: asc) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `;
      const response2 = await graphqlQuery(app, query2);

      expect(response2.body.errors).not.toBeDefined();
      expect(response2.body.data.catsConnection.edges.map(e => e.node.id)).toEqual(
        [cat3, cat2].map(c => c.id).map(id => id.toString()),
      );
    });
  });

  describe('totalCount', () => {
    let cursor;

    it('brings the correct amount for a non-segmented query', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2) {
            edges {
              cursor
            }
            totalCount
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toEqual(3);
      cursor = response.body.data.catsConnection.edges[0].cursor;
    });

    it('brings the correct amount for a segmented query', async () => {
      const query = `
        {
          catsConnection(useOffsetPagination: true, first: 2, after: "${cursor}") {
            edges {
              cursor
            }
            totalCount
          }
        }
      `;
      const response = await graphqlQuery(app, query);

      expect(response.body.errors).not.toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toBeDefined();
      expect(response.body.data.catsConnection.totalCount).toEqual(3);
    });
  });
});
