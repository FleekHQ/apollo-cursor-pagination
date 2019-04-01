"use strict";

const {
  Model
} = require('objection'); // models/BaseModel.js


class BaseModel extends Model {
  static get modelPaths() {
    return [__dirname];
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  $beforeInsert() {
    this.createdAt = new Date().toISOString();
  }

}

module.exports = BaseModel;