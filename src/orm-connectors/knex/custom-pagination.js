const base64 = require('base-64');
const apolloCursorPaginationBuilder = require('../../builder');

const SEPARATION_TOKEN = '___';

const encode = str => base64.encode(str);
const decode = str => base64.decode(str);

const cursorGenerator = (id, customColumnValue) => encode(`${id}${SEPARATION_TOKEN}${customColumnValue}`);

const getDataFromCursor = (cursor) => {
  const decodedCursor = decode(cursor);
  const data = decodedCursor.split(SEPARATION_TOKEN);
  if (data[0] === undefined || data[1] === undefined) {
    throw new Error(`Could not find edge with cursor ${cursor}`);
  }
  return data;
};

// Used when `after` is included in the query
// It must slice the result set from the element after the one with the given cursor until the end.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesBeforeAndIncluding(resultSet, 'B') should return [C, D]
const removeNodesBeforeAndIncluding = (nodesAccessor, cursorOfFinalNode, { orderColumn, ascOrDesc }) => {
  const data = getDataFromCursor(cursorOfFinalNode);
  const [id, columnValue] = data;
  const comparator = ascOrDesc.toLowerCase() === 'asc' ? '>=' : '<=';
  return nodesAccessor.clone().where(orderColumn, comparator, columnValue).whereNot({ id });
};

// Used when `first` is included in the query
// It must remove nodes from the result set starting from the end until it's of size `length`.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesFromEnd(resultSet, 3) should return [A, B, C]
const removeNodesFromEnd = (nodesAccessor, length) => nodesAccessor.clone().limit(length);

// Used when `before` is included in the query
// It must remove all nodes after and including the one with cursor `cursorOfInitialNode`
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesAfterAndIncluding(resultSet, 'C') should return [A, B]
const removeNodesAfterAndIncluding = (nodesAccessor, cursorOfInitialNode, { orderColumn, ascOrDesc }) => {
  const data = getDataFromCursor(cursorOfInitialNode);
  const [id, columnValue] = data;
  const comparator = ascOrDesc.toLowerCase() === 'asc' ? '<=' : '>=';
  return nodesAccessor.clone().where(orderColumn, comparator, columnValue).whereNot({ id });
};

// Used when `last` is included in the query
// It must remove nodes from the result set starting from the beginning until it's of size `length`.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesFromBeginning(resultSet, 3) should return [B, C, D]
const removeNodesFromBeginning = (nodesAccessor, length, currLength) => {
  const result = nodesAccessor.clone().offset(currLength - length);
  return result;
};


const getNodesLength = async (nodesAccessor) => {
  const result = await nodesAccessor.clone();
  return result.length;
};

// Receives a list of nodes and returns it in edge form:
// {
//   cursor
//   node
// }
const convertNodesToEdges = (nodes, _, {
  orderColumn,
}) => nodes.map(node => ({
  cursor: cursorGenerator(node.id, node[orderColumn]),
  node,
}));

const paginate = apolloCursorPaginationBuilder(
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    getNodesLength,
    removeNodesFromEnd,
    removeNodesFromBeginning,
    convertNodesToEdges,
  },
);

module.exports = paginate;