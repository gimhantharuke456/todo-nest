import { Document, Types } from 'mongoose';
import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { Todo } from '../schemas/todo.schema';
import { TodoPriority } from '../dto/create-todo.dto';

export interface TodoDocument extends Todo, Document {
  _id: Types.ObjectId;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  priority?: TodoPriority;
  completed?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface BulkUpdateResult {
  modifiedCount: number;
  matchedCount: number;
}

export interface ITodoRepository {
  create(createTodoDto: CreateTodoDto): Promise<TodoDocument>;
  findAll(options?: FindAllOptions): Promise<PaginatedResult<TodoDocument>>;
  findById(id: string): Promise<TodoDocument | null>;
  update(
    id: string,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoDocument | null>;
  remove(id: string): Promise<TodoDocument | null>;
  bulkUpdate(
    ids: string[],
    updateTodoDto: UpdateTodoDto,
  ): Promise<BulkUpdateResult>;
  bulkDelete(ids: string[]): Promise<number>;
  getStats(): Promise<TodoStats>;
  findByPriority(priority: TodoPriority): Promise<TodoDocument[]>;
  findCompleted(): Promise<TodoDocument[]>;
  findPending(): Promise<TodoDocument[]>;
  search(query: string): Promise<TodoDocument[]>;
}
