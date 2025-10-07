import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { Todo, TodoSchema } from './schemas/todo.schema';
import { TodoRepository } from './repositories/todo.repository';
import { TodoAggregationService } from './services/todo-aggregation.service';
import { TodoTransactionService } from './services/todo-transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
  ],
  controllers: [TodosController],
  providers: [
    TodosService,
    {
      provide: 'ITodoRepository',
      useClass: TodoRepository,
    },
    TodoRepository,
    TodoAggregationService,
    TodoTransactionService,
  ],
  exports: [
    TodosService,
    TodoRepository,
    TodoAggregationService,
    TodoTransactionService,
  ],
})
export class TodosModule {}
