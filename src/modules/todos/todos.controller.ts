import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto, TodoPriority } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Controller('todos')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('completed') completed?: string,
    @Query('priority') priority?: TodoPriority,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const completedBool =
      completed === 'true' ? true : completed === 'false' ? false : undefined;

    return this.todosService.findAll(
      pageNum,
      limitNum,
      completedBool,
      priority,
      search,
    );
  }

  @Get('statistics')
  getStatistics() {
    return this.todosService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }

  @Patch('bulk/complete-all')
  markAllCompleted() {
    return this.todosService.markAllCompleted();
  }

  @Delete('bulk/completed')
  deleteCompleted() {
    return this.todosService.deleteCompleted();
  }
}