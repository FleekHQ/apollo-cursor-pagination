const Knex = require('knex');
const knexOptions = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const knex = Knex(knexOptions[env]);

// for debugging
// knex.on('query', console.log);

module.exports = knex;
