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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto, TodoPriority } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Controller('todos')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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

  @Get('stats')
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
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }

  @Patch('actions/complete-all')
  markAllCompleted() {
    return this.todosService.markAllCompleted();
  }

  @Delete('actions/completed')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCompleted() {
    return this.todosService.deleteCompleted();
  }
}
