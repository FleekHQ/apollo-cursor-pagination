"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _apolloCursorPagination = require("apollo-cursor-pagination");

var _Cat = _interopRequireDefault(require("../../../models/Cat"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = async (_, args) => {
  // const {
  //   first, last, before, after, orderBy, orderDirection, orderByMultiple, orderDirectionMultiple
  // } = args;
  const orderBy = args.orderBy || args.orderByMultiple;
  const orderDirection = args.orderDirection || args.orderDirectionMultiple;

  const baseQuery = _Cat.default.query().sum('id as sum').select('cats.*').groupBy('id');

  const result = await (0, _apolloCursorPagination.knexPaginator)(baseQuery, { ...args,
    orderBy,
    orderDirection
  }, {
    orderByAggregate: orderBy === 'sum'
  });
  return result;
};

exports.default = _default;