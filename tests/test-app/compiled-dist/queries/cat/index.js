"use strict";

var _catsConnection = _interopRequireDefault(require("./root/cats-connection"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  Query: {
    catsConnection: _catsConnection.default
  },
  Cat: {}
};