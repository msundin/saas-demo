import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/helpers'
import { taskService } from '@/features/tasks/services/task.service'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskList } from '@/features/tasks/components/TaskList'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

export default async function DashboardPage() {
  // Require authentication
  const user = await requireAuth().catch(() => {
    redirect('/login')
  })

  // Fetch tasks for the authenticated user
  const tasks = await taskService.getAll(user.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dina ersättningar</h1>
          <p className="text-muted-foreground">
            Välkommen! Hantera din ersättningar nedan
          </p>
        </div>
        <LogoutButton />
      </header>

      <div className="space-y-8">
        <TaskForm />
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
