import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TodoPriority } from '../dto/create-todo.dto';

export type TodoDocument = Todo & Document;

@Schema({
  timestamps: true,
  collection: 'todos',
})
export class Todo {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(TodoPriority),
    default: TodoPriority.MEDIUM,
  })
  priority: TodoPriority;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

// Create indexes for better query performance
TodoSchema.index({ completed: 1 });
TodoSchema.index({ priority: 1 });
TodoSchema.index({ createdAt: -1 });
TodoSchema.index({ title: 'text', description: 'text' });
