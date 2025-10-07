import { TodoPriority } from '../dto/create-todo.dto';

export interface TodoAnalytics {
  totalTodos: number;
  completionRate: number;
  priorityDistribution: Record<TodoPriority, number>;
  averageCompletionTime: number;
  todosCreatedToday: number;
  todosCompletedToday: number;
}

export interface TodoTrends {
  dailyCreation: Array<{
    date: string;
    count: number;
  }>;
  dailyCompletion: Array<{
    date: string;
    count: number;
  }>;
  priorityTrends: Array<{
    priority: TodoPriority;
    count: number;
    percentage: number;
  }>;
}

export interface CompletionStats {
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  dueThisWeek: number;
  completed: number;
  pending: number;
}
