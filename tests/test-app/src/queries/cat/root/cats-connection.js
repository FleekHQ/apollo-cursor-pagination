import { knexPaginator } from 'apollo-cursor-pagination';
import offsetPaginator from 'apollo-cursor-pagination/dist/orm-connectors/knex/offset-based-pagination';
import Cat from '../../../models/Cat';

export default async (_, args) => {
  // const {
  //   first, last, before, after, orderBy, orderDirection, orderByMultiple, orderDirectionMultiple
  // } = args;

  const orderBy = args.orderBy || args.orderByMultiple;
  const orderDirection = args.orderDirection || args.orderDirectionMultiple;

  const baseQuery = Cat.query().sum('id as idsum').select('cats.*').groupBy('id');
  const paginate = args.useOffsetPagination ? offsetPaginator : knexPaginator;
  const result = await paginate(
    baseQuery,
    {
      ...args,
      orderBy,
      orderDirection,
    },
    {
      isAggregateFn: column => column === 'idsum',
      formatColumnFn: column => (column === 'idsum' ? Cat.knex().raw('sum(id)') : column),
    },
  );
  return result;
};
