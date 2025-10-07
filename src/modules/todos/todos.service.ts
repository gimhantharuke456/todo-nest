import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { CreateTodoDto, TodoPriority } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';
import type {
  ITodoRepository,
  BulkUpdateResult,
} from './interfaces/todo-repository.interface';
import { TodoAggregationService } from './services/todo-aggregation.service';
import {
  TodoTransactionService,
  type TransactionResult,
} from './services/todo-transaction.service';
import type { Todo } from './schemas/todo.schema';
import type { TodoAnalytics, TodoTrends, CompletionStats } from './types/types';
import type { TodoDocument } from './interfaces/todo-repository.interface';

@Injectable()
export class TodosService {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly aggregationService: TodoAggregationService,
    private readonly transactionService: TodoTransactionService,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoRepository.create(createTodoDto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    completed?: boolean,
    priority?: TodoPriority,
    search?: string,
  ): Promise<{
    todos: Todo[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const result = await this.todoRepository.findAll({
      page,
      limit,
      completed,
      priority,
      search,
    });

    return {
      todos: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.update(id, updateTodoDto);
    if (!todo) {
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
    return todo;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.todoRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
  }

  async getStatistics(): Promise<{
    total: number;
    completed: number;
    pending: number;
    byPriority: { priority: string; count: number }[];
  }> {
    const stats = await this.todoRepository.getStats();
    return {
      total: stats.total,
      completed: stats.completed,
      pending: stats.pending,
      byPriority: [
        { priority: 'low', count: stats.byPriority.low },
        { priority: 'medium', count: stats.byPriority.medium },
        { priority: 'high', count: stats.byPriority.high },
      ],
    };
  }

  async markAllCompleted(): Promise<{ modifiedCount: number }> {
    const pendingTodos = await this.todoRepository.findPending();
    const ids = pendingTodos.map((todo) => todo._id.toString());
    const result = await this.todoRepository.bulkUpdate(ids, {
      completed: true,
    });
    return { modifiedCount: result.modifiedCount };
  }

  async deleteCompleted(): Promise<{ deletedCount: number }> {
    const completedTodos = await this.todoRepository.findCompleted();
    const ids = completedTodos.map((todo) => todo._id.toString());
    const deletedCount = await this.todoRepository.bulkDelete(ids);
    return { deletedCount };
  }

  // Additional methods using aggregation service
  async getTodoTrends(days: number = 30): Promise<TodoTrends> {
    return this.aggregationService.getTrends(days);
  }

  async getCompletionStats(): Promise<CompletionStats> {
    return this.aggregationService.getCompletionStats();
  }

  async getAnalytics(): Promise<TodoAnalytics> {
    return this.aggregationService.getAnalytics();
  }

  // Additional methods using transaction service
  async createMultipleTodos(
    createTodoDtos: CreateTodoDto[],
  ): Promise<TransactionResult<TodoDocument[]>> {
    return this.transactionService.createMultipleTodos(createTodoDtos);
  }

  async bulkUpdateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>,
  ): Promise<TransactionResult<TodoDocument[]>> {
    return this.transactionService.bulkUpdateTodos(updates);
  }

  async transferTodosBetweenPriorities(
    fromPriority: TodoPriority,
    toPriority: TodoPriority,
    limit?: number,
  ): Promise<TransactionResult<BulkUpdateResult>> {
    return this.transactionService.transferTodosBetweenPriorities(
      fromPriority,
      toPriority,
      limit,
    );
  }

  async archiveCompletedTodos(): Promise<TransactionResult<number>> {
    return this.transactionService.archiveCompletedTodos();
  }
}
