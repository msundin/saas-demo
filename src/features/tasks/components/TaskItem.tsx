'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toggleTask, deleteTask } from '../actions/task-actions'
import type { Task } from '@/lib/drizzle/schema'
import { Button } from '@/components/ui/button'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(task.completed)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (isToggling) return // Prevent rapid clicks

    setIsToggling(true)
    setError(null)

    // Optimistic update
    const previousState = isCompleted
    setIsCompleted(!isCompleted)

    try {
      const result = await toggleTask(task.id)

      if (!result.success) {
        // Revert on failure
        setIsCompleted(previousState)
        setError(result.error)
      }
    } catch {
      // Revert on error
      setIsCompleted(previousState)
      setError('An unexpected error occurred')
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete() {
    if (isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteTask(task.id)

      if (!result.success) {
        setError(result.error)
        setIsDeleting(false)
      }
      // If successful, the component will be removed by parent re-render
    } catch {
      setError('An unexpected error occurred')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        disabled={isToggling}
        aria-label="Mark task as complete"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className={`flex-1 ${isCompleted ? 'opacity-60' : ''}`}>
        <h3
          className={`font-medium ${isCompleted ? 'line-through' : ''}`}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}

        {error && (
          <div
            className="mt-2 rounded-md bg-destructive/15 p-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete task: ${task.title}`}
        className="shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
