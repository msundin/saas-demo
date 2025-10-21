# Architecture & Code Standards

## Feature-Based Architecture

Organize by **features**, not technical layers. Each feature is self-contained.

```
apps/my-saas/
├── features/
│   ├── invoices/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── actions/         # Server Actions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── validations/     # Zod schemas
│   │   └── __tests__/       # Feature tests
│   └── customers/
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
export default async function InvoicesPage() {
  const invoices = await getInvoices()
  return <InvoiceList invoices={invoices} />
}

// ✅ CLIENT COMPONENT (when needed)
'use client'
export function InvoiceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... interactive logic
}
```

### Server Actions
```typescript
// ✅ GOOD - actions/invoice-actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().datetime()
})

export async function createInvoice(input: unknown) {
  try {
    // 1. Validate input
    const data = createInvoiceSchema.parse(input)

    // 2. Check auth
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    // 3. Business logic
    const invoice = await invoiceService.create(user.id, data)

    // 4. Revalidate cache
    revalidatePath('/dashboard/invoices')

    return { success: true, data: invoice }
  } catch (error) {
    console.error('Create invoice error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    }
  }
}
```

### Services (Business Logic)
```typescript
// ✅ GOOD - services/invoice.service.ts

import { supabase } from '@/lib/supabase/server'

export class InvoiceService {
  async create(userId: string, data: CreateInvoiceInput) {
    // Business logic here
    const invoiceNumber = this.generateInvoiceNumber()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    // Side effects (email, analytics, etc.)
    await this.sendInvoiceNotification(invoice)

    return invoice
  }

  private generateInvoiceNumber(): string {
    // Complex logic isolated here
    return `INV-${Date.now()}`
  }
}

export const invoiceService = new InvoiceService()
```

### Validation (Zod)
```typescript
// ✅ GOOD - validations/invoice.schema.ts

import { z } from 'zod'

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'At least one item required')
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
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
  .from('invoices')
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
export default async function InvoicePage() {
  const invoices = await getInvoices()
  return <InvoiceList invoices={invoices} />
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
export async function getInvoices() {
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
<Suspense fallback={<InvoiceListSkeleton />}>
  <InvoiceList />
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
<form action={createInvoiceAction}>
  <input name="amount" />
  <button type="submit">Create</button>
</form>

// With React Hook Form (complex forms)
const { register, handleSubmit } = useForm()
```
