import { TaskItem } from './TaskItem'
import type { Task } from '@/lib/drizzle/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dina ersättningar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">No tasks yet</p>
            <p className="text-sm text-muted-foreground">
              Skapa ditt första ersättningsanspråk.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dina nuvarande ersättningar</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3" role="list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskItem task={task} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
