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
  if (after !== undefined) {
    nodesAccessor = removeNodesBeforeAndIncluding(nodesAccessor, after, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    });
  }
  if (before !== undefined) {
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
    getNodesLength,
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

  const length = await getNodesLength(nodesAccessor);
  if (first !== undefined) {
    if (first < 0) throw new Error('`first` argument must not be less than 0');
    if (length > first) nodesAccessor = removeNodesFromEnd(nodesAccessor, first, length);
  }
  if (last !== undefined) {
    if (last < 0) throw new Error('`last` argument must not be less than 0');
    if (length > last) nodesAccessor = removeNodesFromBeginning(nodesAccessor, last, length);
  }

  return nodesAccessor;
};

/**
 * Returns true if the requested slice has a previous page. False otherwise.
 * @param {Object} allNodesAccessor an accessor to the nodes. Will depend on the concrete implementor.
 * @param {Object} operatorFunctions must contain `getNodesLength`, `removeNodesFromEnd`, `removeNodesFromBeginning`,`removeNodesBeforeAndIncluding` and `removeNodesAfterAndIncluding` functions.
 * @param {Object} graphqlParams must contain `first`, `last`, `before` and `after` query params.
 * @param {Object} orderArgs must contain orderColumn and ascOrDesc. Include only if the implementor requires these params.
 */
const hasPreviousPage = async (allNodesAccessor,
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    getNodesLength,
  }, {
    before, after, first, last,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  }) => {
  if (last) {
    const nodes = applyCursorsToNodes(allNodesAccessor, { before, after }, {
      removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    });
    const length = await getNodesLength(nodes);
    if (length > last) return true;
  }
  // TODO: determine previous page if `after` is set.
  return false;
};

/**
 * Returns true if the requested slice has a next page. False otherwise.
 * @param {Object} allNodesAccessor an accessor to the nodes. Will depend on the concrete implementor.
 * @param {Object} operatorFunctions must contain `getNodesLength`, `removeNodesFromEnd`, `removeNodesFromBeginning`,`removeNodesBeforeAndIncluding` and `removeNodesAfterAndIncluding` functions.
 * @param {Object} graphqlParams must contain `first`, `last`, `before` and `after` query params.
 * @param {Object} orderArgs must contain orderColumn and ascOrDesc. Include only if the implementor requires these params.
 */
const hasNextPage = async (allNodesAccessor,
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    getNodesLength,
  }, {
    before, after, first, last,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  }) => {
  if (first) {
    const nodes = applyCursorsToNodes(allNodesAccessor, { before, after }, {
      removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    });
    const length = await getNodesLength(nodes);
    if (length > first) return true;
  }
  // TODO: determine previous page if `before` is set.
  return false;
};

const totalCount = async (allNodesAccessor,
  {
    removeNodesBeforeAndIncluding,
    removeNodesAfterAndIncluding,
    getNodesLength,
  }, {
    before, after,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  }) => {
  const nodes = applyCursorsToNodes(allNodesAccessor, { before, after }, {
    removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  });
  const length = await getNodesLength(nodes);
  return length;
};

/**
 * Returns a function that must be called to generate a Relay's Connection based page.
 * @param {Object} operatorFunctions must contain `getNodesLength`, `removeNodesFromEnd`, `removeNodesFromBeginning`,`removeNodesBeforeAndIncluding` and `removeNodesAfterAndIncluding` functions.
 */
const apolloCursorPaginationBuilder = ({
  removeNodesBeforeAndIncluding,
  removeNodesAfterAndIncluding,
  getNodesLength,
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
  const { isAggregateFn, formatColumnFn } = opts;
  let {
    orderColumn, ascOrDesc,
  } = opts;
  if (orderColumn) {
    console.warn('"orderColumn" and "ascOrDesc" are being deprecated in favor of "orderBy" and "orderDirection" respectively');
  } else {
    orderColumn = orderBy;
    ascOrDesc = orderDirection;
  }

  const nodes = await nodesToReturn(
    allNodesAccessor,
    {
      removeNodesBeforeAndIncluding,
      removeNodesAfterAndIncluding,
      getNodesLength,
      removeNodesFromEnd,
      removeNodesFromBeginning,
      orderNodesBy,
    }, {
      before, after, first, last,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    },
  );
  const edges = convertNodesToEdges(nodes, {
    before, after, first, last,
  }, {
    orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
  });
  return {
    pageInfo: {
      hasPreviousPage: hasPreviousPage(allNodesAccessor, {
        removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding, getNodesLength,
      }, {
        before, after, first, last,
      }, {
        orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
      }),
      hasNextPage: hasNextPage(allNodesAccessor, {
        removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding, getNodesLength,
      }, {
        before, after, first, last,
      }, {
        orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
      }),
    },
    totalCount: totalCount(allNodesAccessor, {
      removeNodesBeforeAndIncluding, removeNodesAfterAndIncluding, getNodesLength,
    }, {
      before, after, first, last,
    }, {
      orderColumn, ascOrDesc, isAggregateFn, formatColumnFn,
    }),
    edges,
  };
};

module.exports = apolloCursorPaginationBuilder;
