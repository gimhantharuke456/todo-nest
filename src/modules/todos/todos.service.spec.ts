import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TodosService } from './todos.service';
import { TodoAggregationService } from './services/todo-aggregation.service';
import { TodoTransactionService } from './services/todo-transaction.service';
import { CreateTodoDto, TodoPriority } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  ITodoRepository,
  TodoDocument,
} from './interfaces/todo-repository.interface';

describe('TodosService', () => {
  let service: TodosService;
  let mockTodoRepository: jest.Mocked<ITodoRepository>;
  let mockAggregationService: jest.Mocked<TodoAggregationService>;
  let mockTransactionService: jest.Mocked<TodoTransactionService>;

  const mockTodo = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    title: 'Test Todo',
    description: 'Test Description',
    priority: TodoPriority.HIGH,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as TodoDocument;

  const mockCreateTodoDto: CreateTodoDto = {
    title: 'New Todo',
    description: 'New Description',
    priority: TodoPriority.MEDIUM,
    completed: false,
  };

  const mockUpdateTodoDto: UpdateTodoDto = {
    title: 'Updated Todo',
    completed: true,
  };

  beforeEach(async () => {
    mockTodoRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      bulkUpdate: jest.fn(),
      bulkDelete: jest.fn(),
      getStats: jest.fn(),
      findByPriority: jest.fn(),
      findCompleted: jest.fn(),
      findPending: jest.fn(),
      search: jest.fn(),
    };

    mockAggregationService = {
      getAnalytics: jest.fn(),
      getTrends: jest.fn(),
      getCompletionStats: jest.fn(),
      getPriorityDistribution: jest.fn(),
    } as jest.Mocked<TodoAggregationService>;

    mockTransactionService = {
      executeTransaction: jest.fn(),
    } as jest.Mocked<TodoTransactionService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: 'ITodoRepository',
          useValue: mockTodoRepository,
        },
        {
          provide: TodoAggregationService,
          useValue: mockAggregationService,
        },
        {
          provide: TodoTransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a new todo', async () => {
      const expectedTodo = { ...mockTodo, ...mockCreateTodoDto };
      mockTodoRepository.create.mockResolvedValue(expectedTodo);

      const result = await service.create(mockCreateTodoDto);

      expect(mockTodoRepository.create).toHaveBeenCalledWith(mockCreateTodoDto);
      expect(mockTodoRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedTodo);
    });

    it('should create todo with default values when optional fields are not provided', async () => {
      const minimalDto: CreateTodoDto = {
        title: 'Minimal Todo',
      };
      const expectedTodo = {
        ...mockTodo,
        title: 'Minimal Todo',
        priority: TodoPriority.MEDIUM,
        completed: false,
      };
      mockTodoRepository.create.mockResolvedValue(expectedTodo);

      const result = await service.create(minimalDto);

      expect(mockTodoRepository.create).toHaveBeenCalledWith(minimalDto);
      expect(result).toEqual(expectedTodo);
    });

    it('should handle repository errors during creation', async () => {
      const error = new Error('Database connection failed');
      mockTodoRepository.create.mockRejectedValue(error);

      await expect(service.create(mockCreateTodoDto)).rejects.toThrow(error);
      expect(mockTodoRepository.create).toHaveBeenCalledWith(mockCreateTodoDto);
    });
  });

  describe('findOne (get)', () => {
    it('should successfully retrieve a todo by id', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.findById.mockResolvedValue(mockTodo);

      const result = await service.findOne(todoId);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
      expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTodo);
    });

    it('should throw NotFoundException when todo is not found', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(todoId)).rejects.toThrow(
        new NotFoundException(`Todo with ID "${todoId}" not found`),
      );
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidId = 'invalid-id';
      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(invalidId);
    });

    it('should handle repository errors during retrieval', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      const error = new Error('Database connection failed');
      mockTodoRepository.findById.mockRejectedValue(error);

      await expect(service.findOne(todoId)).rejects.toThrow(error);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    });
  });

  describe('update', () => {
    it('should successfully update an existing todo', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      const updatedTodo = { ...mockTodo, ...mockUpdateTodoDto };
      mockTodoRepository.update.mockResolvedValue(updatedTodo);

      const result = await service.update(todoId, mockUpdateTodoDto);

      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        todoId,
        mockUpdateTodoDto,
      );
      expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedTodo);
    });

    it('should throw NotFoundException when updating non-existent todo', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.update.mockResolvedValue(null);

      await expect(service.update(todoId, mockUpdateTodoDto)).rejects.toThrow(
        new NotFoundException(`Todo with ID "${todoId}" not found`),
      );
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        todoId,
        mockUpdateTodoDto,
      );
    });

    it('should handle partial updates correctly', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      const partialUpdate: UpdateTodoDto = { completed: true };
      const updatedTodo = { ...mockTodo, completed: true };
      mockTodoRepository.update.mockResolvedValue(updatedTodo);

      const result = await service.update(todoId, partialUpdate);

      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        todoId,
        partialUpdate,
      );
      expect(result).toEqual(updatedTodo);
    });

    it('should handle repository errors during update', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      const error = new Error('Database connection failed');
      mockTodoRepository.update.mockRejectedValue(error);

      await expect(service.update(todoId, mockUpdateTodoDto)).rejects.toThrow(
        error,
      );
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        todoId,
        mockUpdateTodoDto,
      );
    });
  });

  describe('remove (delete)', () => {
    it('should successfully delete an existing todo', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.remove.mockResolvedValue(mockTodo);

      await service.remove(todoId);

      expect(mockTodoRepository.remove).toHaveBeenCalledWith(todoId);
      expect(mockTodoRepository.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when deleting non-existent todo', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.remove.mockResolvedValue(null);

      await expect(service.remove(todoId)).rejects.toThrow(
        new NotFoundException(`Todo with ID "${todoId}" not found`),
      );
      expect(mockTodoRepository.remove).toHaveBeenCalledWith(todoId);
    });

    it('should handle repository errors during deletion', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      const error = new Error('Database connection failed');
      mockTodoRepository.remove.mockRejectedValue(error);

      await expect(service.remove(todoId)).rejects.toThrow(error);
      expect(mockTodoRepository.remove).toHaveBeenCalledWith(todoId);
    });

    it('should throw NotFoundException when deletion returns falsy value', async () => {
      const todoId = '507f1f77bcf86cd799439011';
      mockTodoRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove(todoId)).rejects.toThrow(
        new NotFoundException(`Todo with ID "${todoId}" not found`),
      );
      expect(mockTodoRepository.remove).toHaveBeenCalledWith(todoId);
    });
  });

  describe('Additional Service Methods', () => {
    it('should get statistics successfully', async () => {
      const mockRepositoryStats = {
        total: 10,
        completed: 5,
        pending: 5,
        byPriority: {
          low: 4,
          medium: 4,
          high: 2,
        },
      };
      const expectedStats = {
        total: 10,
        completed: 5,
        pending: 5,
        byPriority: [
          { priority: 'low', count: 4 },
          { priority: 'medium', count: 4 },
          { priority: 'high', count: 2 },
        ],
      };
      mockTodoRepository.getStats.mockResolvedValue(mockRepositoryStats);

      const result = await service.getStatistics();

      expect(mockTodoRepository.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedStats);
    });

    it('should find all todos with pagination', async () => {
      const mockPaginatedResult = {
        data: [mockTodo],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockTodoRepository.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll(1, 10);

      expect(mockTodoRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        completed: undefined,
        priority: undefined,
        search: undefined,
      });
      expect(result).toEqual({
        todos: mockPaginatedResult.data,
        total: mockPaginatedResult.total,
        page: mockPaginatedResult.page,
        totalPages: mockPaginatedResult.totalPages,
      });
    });
  });
});
