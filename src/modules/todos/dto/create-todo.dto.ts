import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsEnum(TodoPriority)
  @IsOptional()
  readonly priority?: TodoPriority = TodoPriority.MEDIUM;

  @IsBoolean()
  @IsOptional()
  readonly completed?: boolean = false;
}
