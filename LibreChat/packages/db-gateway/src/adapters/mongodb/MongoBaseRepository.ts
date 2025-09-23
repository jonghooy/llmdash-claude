import { Model, Document, FilterQuery } from 'mongoose';
import {
  IRepository,
  QueryFilter,
  QueryOptions,
  ITransaction,
  PaginationOptions,
  PaginatedResult,
} from '../../interfaces/IDbGateway';
import { MongoTransaction } from './MongoTransaction';

/**
 * Base MongoDB repository with common operations
 */
export abstract class MongoBaseRepository<T> implements IRepository<T> {
  protected model: Model<any>;

  constructor(model: Model<any>) {
    this.model = model;
  }

  /**
   * Convert transaction to MongoDB session
   */
  protected getSession(transaction?: ITransaction): any {
    if (transaction && transaction instanceof MongoTransaction) {
      return (transaction as any).getSession();
    }
    return undefined;
  }

  /**
   * Find by ID
   */
  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    let query = this.model.findById(id);

    if (options?.populate) {
      query = query.populate(options.populate as any);
    }

    if (options?.select) {
      query = query.select(options.select);
    }

    if (options?.lean) {
      query = query.lean();
    }

    const result = await query.exec();
    return result as T | null;
  }

  /**
   * Find one document
   */
  async findOne(query: QueryFilter, options?: QueryOptions): Promise<T | null> {
    let mongoQuery = this.model.findOne(query as FilterQuery<any>);

    if (options?.populate) {
      mongoQuery = mongoQuery.populate(options.populate as any);
    }

    if (options?.select) {
      mongoQuery = mongoQuery.select(options.select);
    }

    if (options?.sort) {
      mongoQuery = mongoQuery.sort(options.sort);
    }

    if (options?.lean) {
      mongoQuery = mongoQuery.lean();
    }

    const result = await mongoQuery.exec();
    return result as T | null;
  }

  /**
   * Find multiple documents
   */
  async find(query: QueryFilter, options?: QueryOptions): Promise<T[]> {
    let mongoQuery = this.model.find(query as FilterQuery<any>);

    if (options?.populate) {
      mongoQuery = mongoQuery.populate(options.populate as any);
    }

    if (options?.select) {
      mongoQuery = mongoQuery.select(options.select);
    }

    if (options?.sort) {
      mongoQuery = mongoQuery.sort(options.sort);
    }

    if (options?.limit) {
      mongoQuery = mongoQuery.limit(options.limit);
    }

    if (options?.skip) {
      mongoQuery = mongoQuery.skip(options.skip);
    }

    if (options?.lean) {
      mongoQuery = mongoQuery.lean();
    }

    const results = await mongoQuery.exec();
    return results as T[];
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    query: QueryFilter,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.find(query, { skip, limit, sort, lean: true }),
      this.count(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a document
   */
  async create(data: Partial<T>, transaction?: ITransaction): Promise<T> {
    const session = this.getSession(transaction);
    const doc = new this.model(data);
    const saved = await doc.save({ session });
    return saved.toObject() as T;
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[], transaction?: ITransaction): Promise<T[]> {
    const session = this.getSession(transaction);
    const results = await this.model.insertMany(data, { session });
    return results.map((doc) => doc.toObject() as T);
  }

  /**
   * Update a document
   */
  async update(
    id: string,
    data: Partial<T>,
    transaction?: ITransaction
  ): Promise<T | null> {
    const session = this.getSession(transaction);
    const result = await this.model
      .findByIdAndUpdate(id, data, { new: true, session })
      .lean()
      .exec();
    return result as T | null;
  }

  /**
   * Update multiple documents
   */
  async updateMany(
    query: QueryFilter,
    data: Partial<T>,
    transaction?: ITransaction
  ): Promise<number> {
    const session = this.getSession(transaction);
    const result = await this.model.updateMany(
      query as FilterQuery<any>,
      data,
      { session }
    );
    return result.modifiedCount || 0;
  }

  /**
   * Delete a document
   */
  async delete(id: string, transaction?: ITransaction): Promise<boolean> {
    const session = this.getSession(transaction);
    const result = await this.model.findByIdAndDelete(id, { session });
    return !!result;
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(query: QueryFilter, transaction?: ITransaction): Promise<number> {
    const session = this.getSession(transaction);
    const result = await this.model.deleteMany(query as FilterQuery<any>, { session });
    return result.deletedCount || 0;
  }

  /**
   * Count documents
   */
  async count(query: QueryFilter): Promise<number> {
    return await this.model.countDocuments(query as FilterQuery<any>);
  }

  /**
   * Check if document exists
   */
  async exists(query: QueryFilter): Promise<boolean> {
    const count = await this.model.countDocuments(query as FilterQuery<any>).limit(1);
    return count > 0;
  }

  /**
   * Aggregate pipeline
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }
}