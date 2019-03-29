import { knexPaginator as paginate } from 'apollo-cursor-pagination';
import Cat from '../../../models/Cat';

export default async (_, args) => {
  // const {
  //   first, last, before, after, orderBy, orderDirection, orderByMultiple, orderDirectionMultiple
  // } = args;

  const orderBy = args.orderBy || args.orderByMultiple;
  const orderDirection = args.orderDirection || args.orderDirectionMultiple;

  const baseQuery = Cat.query().sum('id as sum').select('cats.*').groupBy('id');

  const result = await paginate(
    baseQuery,
    {
      ...args,
      orderBy,
      orderDirection,
    },
    {
      isAggregateFn: column => column === 'sum',
      prefixTableNameFn: column => column === 'sum',
    },
  );
  return result;
};
