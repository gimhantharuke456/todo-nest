import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { CreateTodoDto, TodoPriority } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { TodoRepository } from '../repositories/todo.repository';
import {
  TodoDocument,
  BulkUpdateResult,
} from '../interfaces/todo-repository.interface';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BulkOperationData {
  createTodos?: CreateTodoDto[];
  updateTodos?: Array<{ id: string; data: UpdateTodoDto }>;
  deleteTodoIds?: string[];
}

export interface BulkOperationResult {
  created: TodoDocument[];
  updated: TodoDocument[];
  deleted: number;
  errors: string[];
}

@Injectable()
export class TodoTransactionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly todoRepository: TodoRepository,
  ) {}

  async executeInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
  ): Promise<TransactionResult<T>> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      await session.endSession();
    }
  }

  async createMultipleTodos(
    createTodoDtos: CreateTodoDto[],
  ): Promise<TransactionResult<TodoDocument[]>> {
    return this.executeInTransaction(async () => {
      const createdTodos: TodoDocument[] = [];

      for (const createTodoDto of createTodoDtos) {
        const todo = await this.todoRepository.create(createTodoDto);
        createdTodos.push(todo);
      }

      return createdTodos;
    });
  }

  async bulkUpdateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>,
  ): Promise<TransactionResult<TodoDocument[]>> {
    return this.executeInTransaction(async () => {
      const updatedTodos: TodoDocument[] = [];

      for (const update of updates) {
        const todo = await this.todoRepository.update(update.id, update.data);
        if (todo) {
          updatedTodos.push(todo);
        }
      }

      return updatedTodos;
    });
  }

  async bulkDeleteTodos(ids: string[]): Promise<TransactionResult<number>> {
    return this.executeInTransaction(async () => {
      return this.todoRepository.bulkDelete(ids);
    });
  }

  async performBulkOperations(
    operations: BulkOperationData,
  ): Promise<TransactionResult<BulkOperationResult>> {
    return this.executeInTransaction(async () => {
      const result: BulkOperationResult = {
        created: [],
        updated: [],
        deleted: 0,
        errors: [],
      };

      // Create todos
      if (operations.createTodos && operations.createTodos.length > 0) {
        try {
          for (const createTodoDto of operations.createTodos) {
            const todo = await this.todoRepository.create(createTodoDto);
            result.created.push(todo);
          }
        } catch (error) {
          result.errors.push(
            `Create operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Update todos
      if (operations.updateTodos && operations.updateTodos.length > 0) {
        try {
          for (const update of operations.updateTodos) {
            const todo = await this.todoRepository.update(
              update.id,
              update.data,
            );
            if (todo) {
              result.updated.push(todo);
            }
          }
        } catch (error) {
          result.errors.push(
            `Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Delete todos
      if (operations.deleteTodoIds && operations.deleteTodoIds.length > 0) {
        try {
          result.deleted = await this.todoRepository.bulkDelete(
            operations.deleteTodoIds,
          );
        } catch (error) {
          result.errors.push(
            `Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      return result;
    });
  }

  async transferTodosBetweenPriorities(
    fromPriority: TodoPriority,
    toPriority: TodoPriority,
    limit?: number,
  ): Promise<TransactionResult<BulkUpdateResult>> {
    return this.executeInTransaction(async () => {
      // Find todos with the source priority
      const todos = await this.todoRepository.findByPriority(fromPriority);
      const todosToUpdate = limit ? todos.slice(0, limit) : todos;
      const ids = todosToUpdate.map((todo) => todo._id.toString());

      // Update their priority
      return this.todoRepository.bulkUpdate(ids, {
        priority: toPriority,
      });
    });
  }

  async completeAllTodosByPriority(
    priority: TodoPriority,
  ): Promise<TransactionResult<BulkUpdateResult>> {
    return this.executeInTransaction(async () => {
      const todos = await this.todoRepository.findByPriority(priority);
      const pendingTodos = todos.filter((todo) => !todo.completed);
      const ids = pendingTodos.map((todo) => todo._id.toString());

      return this.todoRepository.bulkUpdate(ids, { completed: true });
    });
  }

  async archiveCompletedTodos(): Promise<TransactionResult<number>> {
    return this.executeInTransaction(async () => {
      const completedTodos = await this.todoRepository.findCompleted();
      const ids = completedTodos.map((todo) => todo._id.toString());

      return this.todoRepository.bulkDelete(ids);
    });
  }
}
