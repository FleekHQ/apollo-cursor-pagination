// based on Relay's Connection spec at
// https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm

/**
 * Slices the nodes list according to the `before` and `after` graphql query params.
 * @param {Object} allNodesAccessor an accessor to the nodes. Will depend on the concrete implementor.
 * @param {Object} graphqlParams must contain `before` and `after` query params.
 * @param {Object} operatorFunctions must contain removeNodesBeforeAndIncluding and removeNodesAfterAndIncluding functions.
 * @param {Object} orderArgs must contain orderColumn and ascOrDesc. Include only if the implementor requires these params.
 */
const applyCursorsToNodes = (
  allNodesAccessor,
  { before, after }, {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  },
) => {
  let nodesAccessor = allNodesAccessor;
  if (after) {
    nodesAccessor = removeNodesBeforeAndIncluding(nodesAccessor, after, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    });
  }
  if (before) {
    nodesAccessor = removeNodesAfterAndIncluding(nodesAccessor, before, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    });
  }
  return nodesAccessor;
};

/**
 * Slices a node list according to `before`, `after`, `first` and `last` graphql query params.
 * @param {Object} allNodesAccessor an accessor to the nodes. Will depend on the concrete implementor.
 * @param {Object} operatorFunctions must contain `getNodesLength`, `removeNodesFromEnd`, `removeNodesFromBeginning`,`removeNodesBeforeAndIncluding` and `removeNodesAfterAndIncluding` functions.
 * @param {Object} graphqlParams must contain `first`, `last`, `before` and `after` query params.
 * @param {Object} orderArgs must contain orderColumn and ascOrDesc. Include only if the implementor requires these params.
 */
const nodesToReturn = async (
  allNodesAccessor,
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    hasLengthGreaterThan,
    removeNodesFromEnd,
    removeNodesFromBeginning,
    orderNodesBy,
  },
  {
    before, after, first, last,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  },
) => {
  const orderedNodesAccessor = orderNodesBy(allNodesAccessor, orderColumn, ascOrDesc);
  let nodesAccessor = applyCursorsToNodes(
    orderedNodesAccessor,
    { before, after },
    {
      removeNodesBeforeAndIncluding,
      removeNodesAfterAndIncluding,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    },
  );
  let hasNextPage = !!before;
  let hasPreviousPage = !!after;
  if (first) {
    if (first < 0) throw new Error('`first` argument must not be less than 0');
    hasNextPage = await hasLengthGreaterThan(nodesAccessor, first);
    if (hasNextPage) {
      nodesAccessor = removeNodesFromEnd(nodesAccessor, first, { orderColumn, ascOrDesc });
    }
  }
  if (last) {
    if (last < 0) throw new Error('`last` argument must not be less than 0');
    hasPreviousPage = await hasLengthGreaterThan(nodesAccessor, last);
    if (hasPreviousPage) {
      nodesAccessor = removeNodesFromBeginning(nodesAccessor, last, { orderColumn, ascOrDesc });
    }
  }
  const nodes = await nodesAccessor;
  return { nodes, hasNextPage, hasPreviousPage };
};

/**
 * Returns a function that must be called to generate a Relay's Connection based page.
 * @param {Object} operatorFunctions must contain `getNodesLength`, `removeNodesFromEnd`, `removeNodesFromBeginning`,`removeNodesBeforeAndIncluding` and `removeNodesAfterAndIncluding` functions.
 */
const apolloCursorPaginationBuilder = ({
  removeNodesBeforeAndIncluding,
  removeNodesAfterAndIncluding,
  getNodesLength,
  hasLengthGreaterThan,
  removeNodesFromEnd,
  removeNodesFromBeginning,
  convertNodesToEdges,
  orderNodesBy,
}) => async (
  allNodesAccessor,
  {
    before, after, first, last, orderBy = 'id', orderDirection = 'asc',
  },
  opts = {},
) => {
  const { isAggregateFn, formatColumnFn, skipTotalCount = false } = opts;
  let {
    orderColumn, ascOrDesc,
  } = opts;
  if (orderColumn) {
    console.warn('"orderColumn" and "ascOrDesc" are being deprecated in favor of "orderBy" and "orderDirection" respectively');
  } else {
    orderColumn = orderBy;
    ascOrDesc = orderDirection;
  }

  const { nodes, hasPreviousPage, hasNextPage } = await nodesToReturn(
    allNodesAccessor,
    {
      removeNodesBeforeAndIncluding,
      removeNodesAfterAndIncluding,
      getNodesLength,
      hasLengthGreaterThan,
      removeNodesFromEnd,
      removeNodesFromBeginning,
      orderNodesBy,
    }, {
      before, after, first, last,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    },
  );

  const totalCount = !skipTotalCount && await getNodesLength(allNodesAccessor, {
    getNodesLength,
  });

  const edges = convertNodesToEdges(nodes, {
    before, after, first, last,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  });
  return {
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
    },
    totalCount,
    edges,
  };
};

module.exports = apolloCursorPaginationBuilder;
