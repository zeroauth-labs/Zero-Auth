# Student Verification System - Implementation Guide

This document outlines how to implement a student verification system using Supabase that integrates with the ZeroAuth wallet.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE PROJECT                             │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐  │
│  │  PostgreSQL     │    │  Edge Functions                      │  │
│  │                 │    │                                      │  │
│  │  ┌───────────┐  │    │  ┌──────────────────────────────┐   │  │
│  │  │ students  │  │    │  │ /verify-student              │   │  │
│  │  └───────────┘  │    │  │ - POST(id_number, dob)       │   │  │
│  │                 │    │  │ - Returns credential if valid │   │  │
│  │  ┌───────────┐  │    │  └──────────────────────────────┘   │  │
│  │  │ credentials│ │    │                                      │  │
│  │  │ (issued)  │  │    │  ┌──────────────────────────────┐   │  │
│  │  └───────────┘  │    │  │ /get-credential/:student_id  │   │  │
│  │                 │    │  │ - GET credential by ID       │   │  │
│  │  ┌───────────┐  │    │  └──────────────────────────────┘   │  │
│  │  │ api_keys  │  │    │                                      │  │
│  │  └───────────┘  │    │                                      │  │
│  └─────────────────┘    └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (API via HTTPS)
┌─────────────────────────────────────────────────────────────────────┐
│                      ZEROAUTH WALLET                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  "Add Credential from Issuer"                              │   │
│  │  - User enters ID number + DOB                             │   │
│  │  - Wallet calls Issuer API                                 │   │
│  │  - On success: credential added to wallet                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. Students Table

```sql
-- Main student records
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification (unique per student)
  id_number TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  
  -- Personal details
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Academic info (flexible JSON for different credential types)
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by id_number
CREATE INDEX idx_students_id_number ON students(id_number);

-- Index for verification lookups
CREATE INDEX idx_students_dob ON students(date_of_birth);
```

### 2. Issued Credentials Table (Audit Log)

```sql
-- Track all credentials issued to students
CREATE TABLE issued_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to student
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Credential details
  credential_type TEXT NOT NULL,  -- 'Age Verification', 'Student ID', etc.
  credential_data JSONB NOT NULL,
  
  -- Issue metadata
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  
  -- Request metadata
  request_ip INET,
  request_user_agent TEXT
);

-- Index for looking up credentials by student
CREATE INDEX idx_issued_credentials_student ON issued_credentials(student_id);
```

### 3. API Keys Table (Optional - for rate limiting)

```sql
-- Manage API access (if needed for external services)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Rate limits
  rate_limit_per_hour INTEGER DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (Edge Functions use this)
CREATE POLICY "Service role full access" ON students
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon to verify (via Edge Function - function handles validation)
CREATE POLICY "Allow verify function" ON students
  FOR SELECT TO anon USING (true);

-- No direct insert/update for anon
CREATE POLICY "Deny anon insert" ON students
  FOR INSERT TO anon WITH CHECK (false);

-- Same for issued_credentials
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full credentials" ON issued_credentials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read own" ON issued_credentials
  FOR SELECT TO anon USING (true);
```

---

## Edge Functions

### Function 1: Verify and Issue Credential

**Endpoint:** `POST /functions/v1/verify-student`

**Request:**
```json
{
  "id_number": "STU123456",
  "date_of_birth": "2000-05-15",
  "credential_type": "Student ID",
  "claims": ["full_name", "student_id", "expiry_year"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "credential": {
    "type": "Student ID",
    "id": "cred_abc123",
    "issuedAt": "2026-02-24T10:30:00Z",
    "expiresAt": "2027-02-24T10:30:00Z",
    "issuer": "University Name",
    "attributes": {
      "full_name": "John Doe",
      "student_id": "STU123456",
      "expiry_year": 2027,
      "university": "University Name"
    }
  },
  "message": "Credential verified and issued successfully"
}
```

**Error Responses:**

```json
// 401 - Invalid credentials
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "No student found with this ID number and date of birth"
}

// 429 - Rate limited
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}

// 500 - Server error
{
  "success": false,
  "error": "SERVER_ERROR",
  "message": "An error occurred while processing your request"
}
```

---

### Function 2: Get Student Credential (Optional)

**Endpoint:** `GET /functions/v1/get-student-credential?student_id=<uuid>`

**Headers:**
```
Authorization: Bearer <anon_key>
```

**Success Response (200):**
```json
{
  "success": true,
  "credential": {
    "type": "Student ID",
    "id": "cred_abc123",
    "issuedAt": "2026-02-24T10:30:00Z",
    "expiresAt": "2027-02-24T10:30:00Z",
    "issuer": "University Name",
    "attributes": {
      "full_name": "John Doe",
      "student_id": "STU123456"
    }
  }
}
```

---

## Implementation Steps

### Step 1: Set Up Supabase Project

1. Create a new Supabase project (or use existing)
2. Note down your `SUPABASE_URL` and `anon` key

### Step 2: Run Database Schema

Run the SQL queries the from Database Schema section in the Supabase SQL Editor.

### Step 3: Create Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize (in your project folder)
supabase init

# Link to your project
supabase link --project-ref <your-project-ref>

# Create the verify-student function
supabase functions new verify-student
```

### Step 4: Write the Edge Function Code

```typescript
// supabase/functions/verify-student/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  id_number: string
  date_of_birth: string
  credential_type?: string
  claims?: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { id_number, date_of_birth, credential_type = 'Student ID', claims = ['full_name', 'student_id', 'expiry_year'] }: RequestBody = await req.json()

    // Validate input
    if (!id_number || !date_of_birth) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'id_number and date_of_birth are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Query student
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id_number', id_number)
      .eq('date_of_birth', date_of_birth)
      .single()

    if (error || !student) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'No student found with this ID number and date of birth'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build credential data based on requested claims
    const credentialData: Record<string, unknown> = {}
    for (const claim of claims) {
      if (claim in student.attributes) {
        credentialData[claim] = student.attributes[claim]
      } else if (claim in student) {
        credentialData[claim] = student[claim]
      }
    }

    // Add standard fields
    credentialData.student_id = student.id_number

    // Calculate expiry (1 year from now)
    const issuedAt = new Date()
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Issue credential record
    const { data: credential, error: credError } = await supabase
      .from('issued_credentials')
      .insert({
        student_id: student.id,
        credential_type,
        credential_data: credentialData,
        expires_at: expiresAt.toISOString(),
        request_ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()
      .single()

    if (credError) {
      console.error('Credential issuance error:', credError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Failed to issue credential'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return credential
    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          type: credential_type,
          id: credential.id,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          issuer: 'University Name', // Or from config
          attributes: credentialData
        },
        message: 'Credential verified and issued successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 5: Deploy Edge Function

```bash
supabase functions deploy verify-student
```

### Step 6: Configure Environment

Add to your `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Only for Edge Functions
```

---

## Wallet Integration

### Option A: Direct API Call (Simple)

Add a new screen in the wallet:

```
┌─────────────────────────────┐
│  Verify with University    │
├─────────────────────────────┤
│                             │
│  Student ID Number          │
│  ┌─────────────────────┐   │
│  │ STU123456          │   │
│  └─────────────────────┘   │
│                             │
│  Date of Birth             │
│  ┌─────────────────────┐   │
│  │ 2000-05-15         │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │    Verify           │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Code Example (wallet):**

```typescript
// In wallet - verify-student.ts
async function verifyStudent(idNumber: string, dateOfBirth: string): Promise<Credential> {
  const response = await fetch('https://your-project.supabase.co/functions/v1/verify-student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      id_number: idNumber,
      date_of_birth: dateOfBirth
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  // Convert to wallet credential format
  return {
    id: result.credential.id,
    type: result.credential.type,
    issuer: result.credential.issuer,
    issuedAt: result.credential.issuedAt,
    expiresAt: result.credential.expiresAt,
    attributes: result.credential.attributes
  };
}
```

---

## Security Considerations

### 1. Rate Limiting

Add to Edge Function:

```typescript
// Simple in-memory rate limiting (for low traffic)
// For production, use Supabase's built-in rate limiting or external service

const RATE_LIMIT = 10; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

// Track requests in memory (reset on function cold start)
const requestCounts = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}
```

### 2. Input Validation

```typescript
// Validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate ID number format (adjust as needed)
function isValidIdNumber(id: string): boolean {
  return /^[A-Z0-9]{6,20}$/i.test(id); // Adjust pattern
}
```

### 3. Logging & Monitoring

```typescript
// Log all verification attempts
await supabase
  .from('verification_logs')
  .insert({
    id_number_hash: hash(id_number), // Hash for privacy
    success: result.success,
    ip: req.headers.get('x-forwarded-for'),
    timestamp: new Date().toISOString()
  });
```

---

## Testing the API

### Using curl

```bash
# Test successful verification
curl -X POST https://your-project.supabase.co/functions/v1/verify-student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "id_number": "STU123456",
    "date_of_birth": "2000-05-15"
  }'

# Test invalid credentials
curl -X POST https://your-project.supabase.co/functions/v1/verify-student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "id_number": "INVALID",
    "date_of_birth": "2000-01-01"
  }'
```

### Expected Responses

**Success:**
```json
{
  "success": true,
  "credential": { ... },
  "message": "Credential verified and issued successfully"
}
```

**Invalid Credentials:**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "No student found with this ID number and date of birth"
}
```

---

## Summary

| Component | Description |
|-----------|-------------|
| **Database** | `students` table with id_number, dob, attributes |
| **Edge Function** | `verify-student` - validates and issues credentials |
| **API Format** | POST `{id_number, dob}` → returns credential |
| **Integration** | Wallet calls API, adds credential on success |
| **Security** | RLS, input validation, rate limiting |

---

## Next Steps

1. **Create Supabase project** (or use existing)
2. **Run schema SQL** in SQL Editor
3. **Create Edge Function** using the code above
4. **Deploy**: `supabase functions deploy verify-student`
5. **Test** with curl
6. **Integrate** into wallet
