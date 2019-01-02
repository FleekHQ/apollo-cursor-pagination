import paginate from 'apollo-cursor-pagination/orm-connectors/knex';
import Cat from '../../../models/Cat';

export default async (_, args) => {
  const catAccessor = Cat.query();

  const result = await paginate(catAccessor, args, { orderColumn: 'id', ascOrDesc: 'asc' });
  return result;
};
