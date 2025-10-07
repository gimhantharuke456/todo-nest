import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { Todo } from '../schemas/todo.schema';
import { TodoPriority } from '../dto/create-todo.dto';
import {
  ITodoRepository,
  TodoDocument,
  FindAllOptions,
  PaginatedResult,
  TodoStats,
  BulkUpdateResult,
} from '../interfaces/todo-repository.interface';

@Injectable()
export class TodoRepository implements ITodoRepository {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<TodoDocument> {
    const createdTodo = new this.todoModel(createTodoDto);
    return createdTodo.save();
  }

  async findAll(
    options: FindAllOptions = {},
  ): Promise<PaginatedResult<TodoDocument>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      priority,
      completed,
      search,
    } = options;

    const filter: Record<string, unknown> = {};

    if (priority !== undefined) {
      filter.priority = priority;
    }

    if (completed !== undefined) {
      filter.completed = completed;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      this.todoModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.todoModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<TodoDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.todoModel.findById(id).exec();
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.todoModel
      .findByIdAndUpdate(id, updateTodoDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<TodoDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.todoModel.findByIdAndDelete(id).exec();
  }

  async bulkUpdate(
    ids: string[],
    updateTodoDto: UpdateTodoDto,
  ): Promise<BulkUpdateResult> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const result = await this.todoModel
      .updateMany({ _id: { $in: validIds } }, updateTodoDto)
      .exec();

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const result = await this.todoModel
      .deleteMany({ _id: { $in: validIds } })
      .exec();
    return result.deletedCount;
  }

  async getStats(): Promise<TodoStats> {
    const [totalResult, completedResult, priorityStats] = await Promise.all([
      this.todoModel.countDocuments().exec(),
      this.todoModel.countDocuments({ completed: true }).exec(),
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
    ]);

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
    };

    priorityStats.forEach((stat: { _id: TodoPriority; count: number }) => {
      byPriority[stat._id] = stat.count;
    });

    return {
      total: totalResult,
      completed: completedResult,
      pending: totalResult - completedResult,
      byPriority,
    };
  }

  async findByPriority(priority: TodoPriority): Promise<TodoDocument[]> {
    return this.todoModel.find({ priority }).exec();
  }

  async findCompleted(): Promise<TodoDocument[]> {
    return this.todoModel.find({ completed: true }).exec();
  }

  async findPending(): Promise<TodoDocument[]> {
    return this.todoModel.find({ completed: false }).exec();
  }

  async search(query: string): Promise<TodoDocument[]> {
    return this.todoModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }
}
