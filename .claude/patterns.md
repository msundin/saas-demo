# Common SaaS Patterns

## Security Best Practices

### Row Level Security (RLS)

Always enable RLS on all tables:
```sql
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "Users view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Users create only for themselves
CREATE POLICY "Users create own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### Multi-Tenancy Pattern (Organizations/Workspaces)

Most B2B SaaS requires team-based access, not just individual users.

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

-- Invoices now belong to organizations
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  amount DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team-based access
CREATE POLICY "Users view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members view team invoices"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can create invoices"
  ON invoices FOR INSERT
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

### Supabase vs Drizzle - When to Use What

**Supabase Client (respects RLS automatically):**
```typescript
'use client'
// ✅ Client Components
// ✅ Simple CRUD operations
// ✅ When RLS policies handle authorization
// ✅ Realtime subscriptions

const { data } = await supabase
  .from('posts')
  .select('*')
  // RLS automatically filters by user!
```

**Drizzle ORM (direct PostgreSQL access):**
```typescript
// ✅ Complex queries (joins, aggregations, subqueries)
// ✅ Batch operations
// ✅ Better TypeScript inference
// ✅ Server-side only (Node.js runtime)
// ⚠️ Must handle authorization manually!

const posts = await db
  .select()
  .from(postsTable)
  .where(eq(postsTable.userId, userId)) // Manual filtering required!
  .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))
```

**Critical Security Rule:**
- When using Drizzle, YOU are responsible for authorization
- Always verify user identity before Drizzle queries
- Drizzle bypasses Supabase's RLS layer
- Consider using both: Supabase client for auth check + Drizzle for complex query

---

### Environment Variables Security

```typescript
// ❌ BAD - exposed to client
STRIPE_SECRET_KEY=xxx

// ✅ GOOD - server-only
// Access only in Server Actions or Server Components
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

---

### Rate Limiting

Protect your API routes and Server Actions:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process webhook...
}
```

---

## Webhooks (Receiving)

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
      // Update database
      await updateSubscription(subscription)
      break

    case 'invoice.payment_succeeded':
      // Send invoice email
      await sendInvoiceEmail(event.data.object)
      break
  }

  return Response.json({ received: true })
}
```

---

## File Uploads (Supabase Storage)

```typescript
// actions/upload-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadFile(formData: FormData) {
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
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)

  return { success: true, url: publicUrl }
}
```

---

## Email (Resend + React Email)

```typescript
// lib/email/client.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// emails/invoice-created.tsx
import { Html, Button, Container, Heading, Text } from '@react-email/components'

export function InvoiceCreatedEmail({ invoiceNumber, amount, dueDate }) {
  return (
    <Html>
      <Container>
        <Heading>New Invoice Created</Heading>
        <Text>Invoice #{invoiceNumber} for ${amount}</Text>
        <Text>Due: {dueDate}</Text>
        <Button href={`https://app.example.com/invoices/${invoiceNumber}`}>
          View Invoice
        </Button>
      </Container>
    </Html>
  )
}

// actions/invoice-actions.ts
import { resend } from '@/lib/email/client'
import { InvoiceCreatedEmail } from '@/emails/invoice-created'

async function sendInvoiceEmail(invoice: Invoice) {
  await resend.emails.send({
    from: 'noreply@example.com',
    to: invoice.customer_email,
    subject: `Invoice #${invoice.number}`,
    react: InvoiceCreatedEmail({
      invoiceNumber: invoice.number,
      amount: invoice.amount,
      dueDate: invoice.due_date
    })
  })
}
```

---

## Feature Flags

```typescript
// lib/feature-flags.ts
import { posthog } from '@/lib/posthog'

export async function isFeatureEnabled(
  featureKey: string,
  userId: string
): Promise<boolean> {
  return posthog.isFeatureEnabled(featureKey, userId)
}

// components/new-dashboard.tsx
'use client'

export function Dashboard({ userId }: { userId: string }) {
  const [showNewDashboard, setShowNewDashboard] = useState(false)

  useEffect(() => {
    isFeatureEnabled('new-dashboard', userId).then(setShowNewDashboard)
  }, [userId])

  if (showNewDashboard) {
    return <NewDashboard />
  }

  return <OldDashboard />
}
```

---

## Accessibility

### Accessibility Requirements

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
  aria-label="Close modal"
  onClick={handleClose}
  className="focus:ring-2 focus:ring-blue-500"
>
  <XIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ GOOD - Accessible form
<form>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address
  </label>
  <input
    id="email"
    name="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <p id="email-error" role="alert" className="text-red-600">
      {error}
    </p>
  )}
</form>
```

**Tools:**
- **Testing:** axe DevTools, Lighthouse
- **Screen readers:** NVDA (Windows), VoiceOver (Mac)
- **Components:** Radix UI handles most accessibility automatically
