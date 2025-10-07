import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo } from '../schemas/todo.schema';
import { TodoDocument } from '../interfaces/todo-repository.interface';
import { TodoPriority } from '../dto/create-todo.dto';
import { CompletionStats, TodoAnalytics, TodoTrends } from '../types/types';

@Injectable()
export class TodoAggregationService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
  ) {}

  async getAnalytics(): Promise<TodoAnalytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTodos,
      completedTodos,
      priorityStats,
      todaysCreated,
      todaysCompleted,
    ] = await Promise.all([
      this.todoModel.countDocuments().exec(),
      this.todoModel.countDocuments({ completed: true }).exec(),
      this.getPriorityDistribution(),
      this.todoModel
        .countDocuments({
          createdAt: { $gte: today, $lt: tomorrow },
        })
        .exec(),
      this.todoModel
        .countDocuments({
          completed: true,
          updatedAt: { $gte: today, $lt: tomorrow },
        })
        .exec(),
    ]);

    const completionRate =
      totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    return {
      totalTodos,
      completionRate: Math.round(completionRate * 100) / 100,
      priorityDistribution: priorityStats,
      averageCompletionTime: 0, // This would require tracking completion dates
      todosCreatedToday: todaysCreated,
      todosCompletedToday: todaysCompleted,
    };
  }

  async getTrends(days: number = 7): Promise<TodoTrends> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyCreation, dailyCompletion, priorityTrends] = await Promise.all([
      this.getDailyCreationTrends(startDate, endDate),
      this.getDailyCompletionTrends(startDate, endDate),
      this.getPriorityTrendsWithPercentage(),
    ]);

    return {
      dailyCreation,
      dailyCompletion,
      priorityTrends,
    };
  }

  async getCompletionStats(): Promise<CompletionStats> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [completed, pending] = await Promise.all([
      this.todoModel.countDocuments({ completed: true }).exec(),
      this.todoModel.countDocuments({ completed: false }).exec(),
    ]);

    return {
      overdue: 0, // Would need due date field
      dueToday: 0, // Would need due date field
      dueTomorrow: 0, // Would need due date field
      dueThisWeek: 0, // Would need due date field
      completed,
      pending,
    };
  }

  async getTopPriorityTodos(limit: number = 10): Promise<TodoDocument[]> {
    return this.todoModel
      .find({ completed: false })
      .sort({ priority: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentlyCompleted(limit: number = 10): Promise<TodoDocument[]> {
    return this.todoModel
      .find({ completed: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  private async getPriorityDistribution(): Promise<
    Record<TodoPriority, number>
  > {
    const result = await this.todoModel
      .aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const distribution: Record<TodoPriority, number> = {
      [TodoPriority.LOW]: 0,
      [TodoPriority.MEDIUM]: 0,
      [TodoPriority.HIGH]: 0,
    };

    result.forEach((item: { _id: TodoPriority; count: number }) => {
      distribution[item._id] = item.count;
    });

    return distribution;
  }

  private async getDailyCreationTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; count: number }>> {
    const result = await this.todoModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .exec();

    return result.map((item: { _id: string; count: number }) => ({
      date: item._id,
      count: item.count,
    }));
  }

  private async getDailyCompletionTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; count: number }>> {
    const result = await this.todoModel
      .aggregate([
        {
          $match: {
            completed: true,
            updatedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .exec();

    return result.map((item: { _id: string; count: number }) => ({
      date: item._id,
      count: item.count,
    }));
  }

  private async getPriorityTrendsWithPercentage(): Promise<
    Array<{
      priority: TodoPriority;
      count: number;
      percentage: number;
    }>
  > {
    const [priorityStats, totalCount] = await Promise.all([
      this.todoModel
        .aggregate([
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.todoModel.countDocuments().exec(),
    ]);

    return priorityStats.map((item: { _id: TodoPriority; count: number }) => ({
      priority: item._id,
      count: item.count,
      percentage:
        totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
    }));
  }
}
