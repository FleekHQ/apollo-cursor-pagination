exports.up = (knex, Promise) => knex.schema.createTable('cats', (t) => {
    t.increments('id')
      .unsigned()
      .primary();
    t.dateTime('createdAt').notNull();
    t.dateTime('updatedAt').nullable();
    t.dateTime('deletedAt').nullable();
    t.string('name').notNull();
    t.integer('ownerId').nullable();
    t.index(['name', 'ownerId']);
  });

exports.down = (knex, Promise) => knex.schema.dropTable("cats");
