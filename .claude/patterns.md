# Common SaaS Patterns

This document is split into two parts:
- **Part 1:** Patterns USED in the template app (examples match actual code)
- **Part 2:** Advanced patterns for production apps (beyond template scope)

---

# PART 1: Template Patterns (Implemented)

These patterns are implemented in the task manager template. Examples match the actual codebase.

---

## Security Best Practices

### Row Level Security (RLS)

**File:** `src/lib/drizzle/schema.ts`

Always enable RLS on all tables. The template uses RLS on the `tasks` table:

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Pattern: auth.uid() = user_id for all CRUD operations
CREATE POLICY "policy_name" ON tasks
  FOR SELECT/INSERT/UPDATE/DELETE
  USING (auth.uid() = user_id);
```

**Key concept:** Every policy checks `auth.uid() = user_id` to ensure users only access their own data.

---

## Server Actions Pattern

**File:** `src/features/tasks/actions/task-actions.ts`

The template uses Server Actions for all mutations. All actions follow this 5-step pattern:

```typescript
export async function createTask(input: CreateTaskInput): Promise<ActionResponse<Task>> {
  try {
    // 1. Check authentication
    const user = await requireAuth()

    // 2. Validate input
    const validatedData = createTaskSchema.parse(input)

    // 3. Business logic (via service layer)
    const task = await taskService.create(user.id, validatedData)

    // 4. Revalidate cache
    revalidatePath('/dashboard')

    // 5. Type-safe response
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

**Always in this order:** Auth → Validate → Logic → Cache → Response

---

## Validation with Zod

All user inputs are validated with Zod schemas. From `src/features/tasks/validations/task.schema.ts`:

```typescript
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

export type CreateTaskInput = z.infer<typeof createTaskSchema>
```

**Benefits:**
- Type-safe validation
- User-friendly error messages
- Reusable across Server Actions and client forms
- Automatic TypeScript types

---

## Service Layer Pattern

**File:** `src/features/tasks/services/task.service.ts`

Business logic is isolated in service classes. The template implements:

```typescript
export class TaskService {
  async create(userId: string, input: CreateTaskInput): Promise<Task>
  async getAll(userId: string): Promise<Task[]>
  async toggle(taskId: string, userId: string): Promise<Task>
  async delete(taskId: string, userId: string): Promise<void>
}

export const taskService = new TaskService()
```

**Pattern (example from `create` method):**
```typescript
async create(userId: string, input: CreateTaskInput): Promise<Task> {
  // 1. Get Supabase client
  const supabase = await createClient()

  // 2. Insert with user_id + validated data
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...input })

  // 3. Handle errors, return typed result
  if (error) throw new Error(`Failed: ${error.message}`)
  return data as Task
}
```

**Why Service Layer:**
- Testable business logic in isolation
- Reusable across Server Actions
- Clear separation of concerns
- Easy to mock in tests

---

## Authentication Pattern

The template uses Supabase Auth with helper functions. From `src/lib/auth/helpers.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
```

**Usage in Server Actions:**
```typescript
export async function createTask(input: CreateTaskInput) {
  // This throws if not authenticated
  const user = await requireAuth()

  // Proceed with authenticated logic...
}
```

---

## Supabase Client (RLS Enforced)

For simple CRUD operations, use Supabase client. RLS automatically filters by user.

```typescript
// From task.service.ts - RLS enforced
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId) // RLS double-checks this
  .order('created_at', { ascending: false })
```

**Benefits:**
- RLS policies automatically enforced
- No manual authorization needed
- Works in Server Components and Server Actions
- Safe for client-side queries (with proper RLS)

---

## Database Schema (Drizzle)

**File:** `src/lib/drizzle/schema.ts`

Schema is generated from Supabase migrations via introspection. Pattern:

```typescript
import { pgTable, pgPolicy, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const tasks = pgTable(
  'tasks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    userId: uuid('user_id').notNull(),
    // ... other columns
  },
  (_table) => [
    pgPolicy('policy_name', {
      as: 'permissive',
      for: 'select', // or insert/update/delete
      using: sql`(auth.uid() = user_id)`,
    }),
  ]
)

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
```

---

# PART 2: Advanced Patterns (Beyond Template)

These patterns are NOT implemented in the template but show how to extend it for production SaaS applications.

---

## Multi-Tenancy Pattern (Team Workspaces)

**⚠️ Advanced: Beyond Template Scope**

Most B2B SaaS requires team-based access, not just individual users. Here's how to extend the tasks app to support team workspaces:

**Database Schema:**
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (junction table)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Extend tasks to belong to organizations
ALTER TABLE tasks ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team-based access
CREATE POLICY "Users view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members view team tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**TypeScript Types:**
```typescript
// types/organization.types.ts
export type OrganizationRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  created_at: string
}
```

**Helper Functions:**
```typescript
// lib/auth/organization.ts
export async function getCurrentOrganization(
  organizationId: string
): Promise<Organization | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return data
}

export async function hasOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole?: OrganizationRole
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (requiredRole) {
    const roleHierarchy = { owner: 3, admin: 2, member: 1 }
    query = query.gte('role', roleHierarchy[requiredRole])
  }

  const { data } = await query.single()
  return !!data
}
```

---

## Drizzle ORM for Complex Queries

**⚠️ Advanced: Use with caution**

For complex queries (joins, aggregations), use Drizzle ORM directly. **Important:** Drizzle bypasses RLS, so you MUST handle authorization manually.

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
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .orderBy(tasksTable.createdAt)

  return Response.json(tasks)
}
```

**Critical Security Rule:**
- When using Drizzle, YOU are responsible for authorization
- Always verify user identity before Drizzle queries
- Drizzle bypasses Supabase's RLS layer
- Consider using both: Supabase client for auth check + Drizzle for complex query

---

## Stripe Webhooks (Payments)

**⚠️ Advanced: Beyond Template Scope**

If adding subscriptions or payments to your task app:

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return Response.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      const subscription = event.data.object
      // Update user subscription in database
      await updateSubscription(subscription)
      break

    case 'customer.subscription.deleted':
      // Downgrade user to free plan
      await handleSubscriptionCancellation(event.data.object)
      break
  }

  return Response.json({ received: true })
}
```

---

## File Uploads (Supabase Storage)

**⚠️ Advanced: Adding attachments to tasks**

How to add file attachments to tasks:

```typescript
// actions/upload-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadTaskAttachment(taskId: string, formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type' }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'File too large' }
  }

  // Upload to Supabase Storage
  const fileName = `${taskId}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(fileName)

  // Update task with attachment URL
  await supabase
    .from('tasks')
    .update({ attachment_url: publicUrl })
    .eq('id', taskId)

  revalidatePath('/dashboard')
  return { success: true, url: publicUrl }
}
```

---

## Email Notifications (Resend + React Email)

**⚠️ Advanced: Task reminders and notifications**

How to add email notifications for tasks:

```typescript
// lib/email/client.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// emails/task-reminder.tsx
import { Html, Button, Container, Heading, Text } from '@react-email/components'

export function TaskReminderEmail({ taskTitle, taskId }) {
  return (
    <Html>
      <Container>
        <Heading>Task Reminder</Heading>
        <Text>Don't forget about: {taskTitle}</Text>
        <Button href={`https://app.example.com/dashboard?task=${taskId}`}>
          View Task
        </Button>
      </Container>
    </Html>
  )
}

// actions/task-actions.ts (extended)
import { resend } from '@/lib/email/client'
import { TaskReminderEmail } from '@/emails/task-reminder'

async function sendTaskReminder(task: Task, userEmail: string) {
  await resend.emails.send({
    from: 'noreply@example.com',
    to: userEmail,
    subject: `Reminder: ${task.title}`,
    react: TaskReminderEmail({
      taskTitle: task.title,
      taskId: task.id
    })
  })
}
```

---

## Rate Limiting

**⚠️ Advanced: Protect public endpoints**

Protect your API routes and Server Actions from abuse:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

// app/api/webhooks/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process request...
}
```

---

## Feature Flags (PostHog)

**⚠️ Advanced: A/B testing and gradual rollouts**

How to add feature flags to gradually roll out new task features:

```typescript
// lib/feature-flags.ts
import { posthog } from '@/lib/posthog'

export async function isFeatureEnabled(
  featureKey: string,
  userId: string
): Promise<boolean> {
  return posthog.isFeatureEnabled(featureKey, userId)
}

// components/task-list.tsx
'use client'

export function TaskList({ userId }: { userId: string }) {
  const [showNewUI, setShowNewUI] = useState(false)

  useEffect(() => {
    isFeatureEnabled('new-task-ui', userId).then(setShowNewUI)
  }, [userId])

  if (showNewUI) {
    return <NewTaskList />
  }

  return <OldTaskList />
}
```

---

## Accessibility

**⚠️ Universal: Apply to all apps**

All features must meet WCAG 2.1 AA standards:

**1. Keyboard Navigation**
- All interactive elements accessible via keyboard
- Logical tab order
- Visible focus indicators
- Escape key closes modals/dropdowns

**2. Screen Reader Support**
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels where needed
- Alt text for images
- Form labels properly associated

**3. Color & Contrast**
- Minimum 4.5:1 contrast for normal text
- Minimum 3:1 for large text
- Don't rely on color alone
- Support for dark mode

**4. Forms**
- Clear labels for all inputs
- Error messages announced to screen readers
- Validation feedback visible and audible

**Example:**
```typescript
// ✅ GOOD - Accessible button
<button
  type="button"
  aria-label="Delete task"
  onClick={handleDelete}
  className="focus:ring-2 focus:ring-blue-500"
>
  <TrashIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ GOOD - Accessible form
<form>
  <label htmlFor="title" className="block text-sm font-medium">
    Task Title
  </label>
  <input
    id="title"
    name="title"
    type="text"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? "title-error" : undefined}
  />
  {error && (
    <p id="title-error" role="alert" className="text-red-600">
      {error}
    </p>
  )}
</form>
```

**Tools:**
- **Testing:** axe DevTools, Lighthouse
- **Screen readers:** NVDA (Windows), VoiceOver (Mac)
- **Components:** Radix UI handles most accessibility automatically
