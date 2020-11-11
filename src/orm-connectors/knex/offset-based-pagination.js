const apolloCursorPaginationBuilder = require('../../builder');

/**
 * This implementation uses offset and is less restrictive than the stable one,
 * as it does not require order params.
 * However it's less robust as generated cursors are not stable.
 * That means that if an item is added to a paginated list that already had cursors calculated,
 * it will change the cursors of all following items in the list.
 * It also does not support reverse pagination.
 * Use only for lists that are not constantly changing.
 */

const SEPARATION_TOKEN = '___';

const encode = str => Buffer.from(str).toString('base64');
const decode = str => Buffer.from(str, 'base64').toString();

const cursorGenerator = (id, offset) => encode(`${id}${SEPARATION_TOKEN}${offset}`);

const getOffsetFromCursor = (cursor) => {
  const decodedCursor = decode(cursor);
  const offset = decodedCursor.split(SEPARATION_TOKEN)[1];
  if (offset === undefined) throw new Error(`Could not find edge with cursor ${cursor}`);
  return parseInt(offset, 10);
};

// Used when `after` is included in the query
// It must slice the result set from the element after the one with the given cursor until the end.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesBeforeAndIncluding(resultSet, 'B') should return [C, D]
//
// In this case, it's implemented with the offset function of SQL
// in order to not execute a query and do iterations across the data
const removeNodesBeforeAndIncluding = (nodesAccessor, cursorOfFinalNode) => {
  const offset = getOffsetFromCursor(cursorOfFinalNode);
  return nodesAccessor.offset(offset);
};

// Used when `first` is included in the query
// It must remove nodes from the result set starting from the end until it's of size `length`.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesFromEnd(resultSet, 3) should return [A, B, C]
//
// In this case, it's implemented with the limit function of SQL
// in order to not execute a query and do iterations across the data
const removeNodesFromEnd = (nodesAccessor, length) => nodesAccessor.limit(length);

const notImplemented = () => {
  throw new Error('`last` and `before` are not supported.');
};

const getNodesLength = async (nodesAccessor) => {
  const result = await nodesAccessor.clone();
  return result.length;
};

const orderNodesBy = (nodesAccessor, { orderColumn = 'id', ascOrDesc = 'asc' }) => {
  const result = nodesAccessor.clone().orderBy(orderColumn, ascOrDesc).orderBy('id', ascOrDesc);
  return result;
};

const hasLengthGreaterThan = async (nodesAccessor, amount) => {
  const result = await nodesAccessor.clone().limit(amount + 1);
  return result.length === amount + 1;
};

// Receives a list of nodes and returns it in edge form:
// {
//   cursor
//   node
// }
const convertNodesToEdges = (nodes, {
  after,
}) => {
  const offset = after ? getOffsetFromCursor(after) : 0;
  return nodes.map((node, idx) => ({
    cursor: cursorGenerator(node.id, idx + 1 + offset),
    node,
  }));
};

const paginate = apolloCursorPaginationBuilder(
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding: notImplemented,
    getNodesLength,
    hasLengthGreaterThan,
    removeNodesFromEnd,
    removeNodesFromBeginning: notImplemented,
    convertNodesToEdges,
    orderNodesBy,
  },
);

module.exports = paginate;
