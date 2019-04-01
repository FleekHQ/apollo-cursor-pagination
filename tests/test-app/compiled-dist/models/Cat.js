"use strict";

const BaseModel = require('./base-model');

const knex = require('./db');

BaseModel.knex(knex);

class Cat extends BaseModel {
  static get tableName() {
    return 'cats';
  }

}

module.exports = Cat;