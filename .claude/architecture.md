# Architecture & Code Standards

## Feature-Based Architecture

Organize by **features**, not technical layers. Each feature is self-contained.

```
apps/my-saas/
├── features/
│   ├── tasks/              # Task management feature
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── actions/         # Server Actions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── validations/     # Zod schemas
│   │   └── __tests__/       # Feature tests
│   └── auth/               # Authentication feature (if separate)
│       └── (same structure)
├── lib/
│   ├── supabase/           # Database client
│   ├── drizzle/            # Drizzle ORM client
│   ├── utils/              # Shared utilities
│   └── constants/          # App constants
└── app/
    └── (routes)            # Next.js App Router
```

---

## Layer Responsibilities

**1. Presentation Layer** (`components/` + `hooks/`)
- UI components (Server & Client)
- React hooks for client-side state
- NO business logic
- NO direct database access

**2. Application Layer** (`actions/` + `services/`)
- `actions/`: Server Actions for mutations
- `services/`: Complex business logic
- Coordinates between presentation and data
- Error handling and validation

**3. Data Layer** (`lib/supabase/` + `lib/drizzle/`)
- Database queries (via Supabase client or Drizzle)
- API integrations
- Data transformations
- Type definitions from database

**4. Domain Layer** (`types/` + `validations/`)
- TypeScript types
- Zod schemas for validation
- Business rules and constraints
- No framework dependencies

---

## Code Standards

### TypeScript
```typescript
// ✅ GOOD
interface User {
  id: string
  email: string
  name: string | null
}

// ❌ BAD - avoid any
function getData(input: any) { }

// ✅ GOOD - explicit types
function getData(input: CreateUserInput): Promise<User> { }
```

### React Components
```typescript
// ✅ SERVER COMPONENT (default)
export default async function TasksPage() {
  const tasks = await getTasks()
  return <TaskList tasks={tasks} />
}

// ✅ CLIENT COMPONENT (when needed)
'use client'
export function TaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... interactive logic
}
```

### Server Actions
```typescript
// ✅ GOOD - actions/task-actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable()
})

export async function createTask(input: unknown) {
  try {
    // 1. Validate input
    const data = createTaskSchema.parse(input)

    // 2. Check auth
    const user = await requireAuth()

    // 3. Business logic
    const task = await taskService.create(user.id, data)

    // 4. Revalidate cache
    revalidatePath('/dashboard')

    return { success: true, data: task }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    }
  }
}
```

### Services (Business Logic)
```typescript
// ✅ GOOD - services/task.service.ts

import { createClient } from '@/lib/supabase/server'

export class TaskService {
  async create(userId: string, data: CreateTaskInput) {
    const supabase = await createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        completed: false
      })
      .select()
      .single()

    if (error) throw error

    return task
  }

  async toggle(taskId: string, userId: string) {
    const supabase = await createClient()

    // Get current task
    const { data: current } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    // Toggle completion
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ completed: !current.completed })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return task
  }
}

export const taskService = new TaskService()
```

### Validation (Zod)
```typescript
// ✅ GOOD - validations/task.schema.ts

import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).optional().nullable(),
  completed: z.boolean().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
```

---

## Database Access Patterns

### Supabase Client (RLS Enforced)
```typescript
// ✅ GOOD - Row Level Security enforced

// Server Component
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// RLS automatically filters by user
```

### Drizzle ORM (Manual Authorization Required)
```typescript
// ✅ GOOD - lib/drizzle/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// PgBouncer/Supavisor compatible configuration
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  prepare: false, // Required for PgBouncer compatibility
})

export const db = drizzle(client)
```

```typescript
// ✅ GOOD - Complex query with manual auth check
import { db } from '@/lib/drizzle/client'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'

export async function GET() {
  // 1. Always verify auth when using Drizzle
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Manually filter by user - Drizzle bypasses RLS!
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.userId, user.id))
    .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))

  return Response.json(posts)
}
```

---

## Performance Optimization

### Server Components by Default
```typescript
// ✅ GOOD - Server Component (default)
export default async function TasksPage() {
  const tasks = await getTasks()
  return <TaskList tasks={tasks} />
}

// Only use 'use client' when necessary
```

### Dynamic Imports for Heavy Components
```typescript
// ✅ GOOD - lazy load chart library
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})
```

### Caching Strategies
```typescript
// Static (rebuilt on deploy)
export const revalidate = false

// ISR (revalidate every hour)
export const revalidate = 3600

// Dynamic (always fresh)
export const dynamic = 'force-dynamic'

// Next.js 15: use cache directive
'use cache'
export async function getTasks() {
  // Function-level caching
}
```

### Image Optimization
```typescript
// ✅ GOOD - Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // for LCP images
  placeholder="blur"
/>
```

---

## Common Patterns

### Loading States
```typescript
// Server Component with Suspense
<Suspense fallback={<TaskListSkeleton />}>
  <TaskList />
</Suspense>

// Client Component with state
const [loading, setLoading] = useState(false)
```

### Error Handling
```typescript
// Server Action
return { success: false, error: 'User friendly message' }

// Try-catch in components
try {
  await action()
} catch (error) {
  toast.error('Something went wrong')
  console.error(error)
}
```

### Form Handling
```typescript
// With Server Actions (recommended)
<form action={createTaskAction}>
  <input name="title" />
  <textarea name="description" />
  <button type="submit">Create Task</button>
</form>

// With React Hook Form (complex forms)
const { register, handleSubmit } = useForm()
```
