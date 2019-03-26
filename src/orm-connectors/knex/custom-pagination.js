const base64 = require('base-64');
const apolloCursorPaginationBuilder = require('../../builder');

const SEPARATION_TOKEN = '_*_';
const ARRAY_DATA_SEPARATION_TOKEN = '_%_';

const encode = str => base64.encode(str);
const decode = str => base64.decode(str);

const operateOverScalarOrArray = (initialValue, scalarOrArray, operation, operateResult) => {
  let result = initialValue;
  const isArray = Array.isArray(scalarOrArray);
  if (isArray) {
    scalarOrArray.forEach((scalar, index) => {
      result = operation(scalar, index, result);
    });
  } else {
    result = operation(scalarOrArray, null, result);
  }
  if (operateResult) {
    result = operateResult(result, isArray);
  }

  return result;
};

const cursorGenerator = (id, customColumnValue) => encode(`${id}${SEPARATION_TOKEN}${customColumnValue}`);

const getDataFromCursor = (cursor) => {
  const decodedCursor = decode(cursor);
  const data = decodedCursor.split(SEPARATION_TOKEN);
  if (data[0] === undefined || data[1] === undefined) {
    throw new Error(`Could not find edge with cursor ${cursor}`);
  }
  return data;
};

const buildRemoveNodesFromBeforeOrAfer = (beforeOrAfter) => {
  const getComparator = (orderDirection) => {
    if (beforeOrAfter === 'after') return orderDirection === 'asc' ? '<' : '>';
    return orderDirection === 'asc' ? '>' : '<';
  };
  return (nodesAccessor, cursorOfInitialNode, { orderColumn, ascOrDesc }) => {
    const data = getDataFromCursor(cursorOfInitialNode);
    const [id, columnValue] = data;
    const initialValue = nodesAccessor.clone();

    const result = operateOverScalarOrArray(initialValue, orderColumn, (orderBy, index, prev) => {
      let orderDirection;
      let value;
      const values = columnValue.split(ARRAY_DATA_SEPARATION_TOKEN);
      if (index !== null) {
        orderDirection = ascOrDesc[index].toLowerCase();
        value = values[index];
      } else {
        orderDirection = ascOrDesc.toLowerCase();
        value = columnValue;
      }
      const comparator = getComparator(orderDirection);

      if (index > 0) {
        const nested = prev.orWhere(function () {
          this.where(orderColumn[index], `${comparator}=`, values[index])
            .andWhere(orderColumn[index - 1], '=', values[index - 1]);
        });
        return nested;
      }

      return prev.where(orderBy, index === null ? `${comparator}=` : comparator, value);
    }, prev => prev.whereNot({ id }));
    return result;
  };
};

// Used when `after` is included in the query
// It must slice the result set from the element after the one with the given cursor until the end.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesBeforeAndIncluding(resultSet, 'B') should return [C, D]
const removeNodesBeforeAndIncluding = buildRemoveNodesFromBeforeOrAfer('before');

// Used when `first` is included in the query
// It must remove nodes from the result set starting from the end until it's of size `length`.
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesFromEnd(resultSet, 3) should return [A, B, C]
const removeNodesFromEnd = (nodesAccessor, length) => nodesAccessor.clone().limit(length);

// Used when `before` is included in the query
// It must remove all nodes after and including the one with cursor `cursorOfInitialNode`
// e.g. let [A, B, C, D] be the `resultSet`
// removeNodesAfterAndIncluding(resultSet, 'C') should return [A, B]
const removeNodesAfterAndIncluding = buildRemoveNodesFromBeforeOrAfer('after');

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

const orderNodesBy = (nodesAccessor, orderColumn = 'id', ascOrDesc = 'asc') => {
  const initialValue = nodesAccessor.clone();
  const result = operateOverScalarOrArray(initialValue, orderColumn, (orderBy, index, prev) => {
    if (index !== null) {
      return prev.orderBy(orderBy, ascOrDesc[index]);
    }
    return prev.orderBy(orderBy, ascOrDesc);
  }, (prev, isArray) => (isArray ? prev.orderBy('id', ascOrDesc[0]) : prev.orderBy('id', ascOrDesc)));
  return result;
};

// Receives a list of nodes and returns it in edge form:
// {
//   cursor
//   node
// }
const convertNodesToEdges = (nodes, _, {
  orderColumn,
}) => nodes.map((node) => {
  const dataValue = operateOverScalarOrArray('', orderColumn, (orderBy, index, prev) => {
    const nodeValue = node[orderBy];
    const result = `${prev}${index ? ARRAY_DATA_SEPARATION_TOKEN : ''}${nodeValue}`;
    return result;
  });

  return {
    cursor: cursorGenerator(node.id, dataValue),
    node,
  };
});

const paginate = apolloCursorPaginationBuilder(
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    getNodesLength,
    removeNodesFromEnd,
    removeNodesFromBeginning,
    convertNodesToEdges,
    orderNodesBy,
  },
);

module.exports = paginate;
