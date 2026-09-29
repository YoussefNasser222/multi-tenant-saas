import {
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  HydratedDocument,
  DeleteResult,
} from 'mongoose';

export class AbstractRepository<T> {
  constructor(private readonly model: Model<T>) {}

  public async create(item: Partial<T>): Promise<HydratedDocument<T>> {
    const doc = new this.model(item);
    return (await doc.save()) as unknown as HydratedDocument<T>;
  }

  public async getOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOne(
      filter,
      projection,
      options,
    ) as unknown as Promise<HydratedDocument<T> | null>;
  }

  public async update(
    filter: QueryFilter<T>,
    updateQuery: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(
      filter,
      updateQuery,
      options,
    ) as unknown as Promise<HydratedDocument<T> | null>;
  }

  public async getAll(
    filter?: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T>[]> {
    return this.model.find(filter, projection, options) as unknown as Promise<
      HydratedDocument<T>[]
    >;
  }

  public async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  /** distinct values of a field (way cheaper than loading every document just to dedupe them) */
  public async distinct(field: string, filter: QueryFilter<T> = {}): Promise<any[]> {
    return this.model.distinct(field, filter);
  }

  /** highest numeric value of a field (or 0). Used e.g. for the next queue number. */
  public async maxOf(field: string, filter: QueryFilter<T> = {}): Promise<number> {
    const top = (await this.model
      .findOne(filter, { [field]: 1 } as any)
      .sort({ [field]: -1 })
      .lean()) as any;
    return Number(top?.[field]) || 0;
  }

  public async deleteOne(filter: QueryFilter<T>): Promise<DeleteResult> {
    return this.model.deleteOne(filter);
  }

  public async deleteMany(filter: QueryFilter<T>): Promise<DeleteResult> {
    return this.model.deleteMany(filter);
  }
  public async updateMany(
    filter: QueryFilter<T>,
    updateQuery: UpdateQuery<T>,
  ): Promise<any> {
    return this.model.updateMany(filter, updateQuery);
  }
}
