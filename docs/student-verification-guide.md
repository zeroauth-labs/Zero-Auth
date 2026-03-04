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
│  │  └───────────┘  │    │  │ /get-credential              │   │  │
│  │                 │    │  │ - GET by credential_uuid      │   │  │
│  │  ┌───────────┐  │    │  └──────────────────────────────┘   │  │
│  │  │ api_keys  │  │    │                                      │  │
│  │  └───────────┘  │    │  ┌──────────────────────────────┐   │  │
│  │                 │    │  │ /validate-credential          │   │  │
│  │  ┌───────────┐  │    │  │ - Verify credential validity  │   │  │
│  │  │admin_users│ │    │  └──────────────────────────────┘   │  │
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

### Tables Created

| Table | Purpose |
|-------|---------|
| `students` | Main student records from college database |
| `issued_credentials` | Audit log of all credentials issued |
| `verification_logs` | Privacy-preserving audit trail |
| `api_keys` | API access management |
| `issuer_config` | Configurable issuer information |
| `admin_users` | University staff with admin access |

### Key Indexes

```sql
-- Fast lookups by student ID
CREATE INDEX idx_students_id_number ON students(id_number);
CREATE INDEX idx_students_dob ON students(date_of_birth);

-- Fast credential lookups
CREATE INDEX idx_issued_credentials_student ON issued_credentials(student_id);
CREATE INDEX idx_issued_credentials_uuid ON issued_credentials(credential_uuid);
CREATE INDEX idx_issued_credentials_not_revoked ON issued_credentials(revoked) WHERE revoked = false;
```

### Row Level Security (RLS)

- **Service role**: Full access (for Edge Functions)
- **Admin users**: Full access to students and credentials
- **Anon users**: 
  - Can verify credentials via `verify-student`
  - Can validate credentials via `validate-credential`
  - Can read non-revoked credentials via `get-credential`
  - Cannot directly query tables

---

## Edge Functions

### 1. verify-student

**Endpoint:** `POST /functions/v1/verify-student`

Verifies student identity and issues a credential.

**Request:**
```json
{
  "id_number": "STU2024001",
  "date_of_birth": "2002-03-15",
  "credential_type": "Student ID",
  "claims": ["full_name", "id_number", "enrollment_status"],
  "idempotency_key": "optional-unique-key"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "credential": {
    "type": "Student ID",
    "id": "cred_abc123def456",
    "issuedAt": "2026-03-04T10:30:00Z",
    "expiresAt": "2027-03-04T10:30:00Z",
    "issuer": "State University",
    "attributes": {
      "full_name": "Alice Johnson",
      "id_number": "STU2024001",
      "enrollment_status": "active"
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

// 403 - Not allowed
{
  "success": false,
  "error": "NOT_ALLOWED",
  "message": "Student has opted out of credential issuance"
}

// 429 - Rate limited
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}
```

---

### 2. get-credential

**Endpoint:** `GET /functions/v1/get-credential?credential_uuid=<uuid>`

Retrieves a specific credential by UUID.

**Response:**
```json
{
  "success": true,
  "credential": {
    "type": "Student ID",
    "id": "cred_abc123def456",
    "issuedAt": "2026-03-04T10:30:00Z",
    "expiresAt": "2027-03-04T10:30:00Z",
    "issuer": "State University",
    "attributes": {...},
    "isRevoked": false,
    "isExpired": false
  }
}
```

---

### 3. validate-credential

**Endpoint:** `POST /functions/v1/validate-credential`

Verifies if a credential is valid (for verifiers like businesses).

**Request:**
```json
{
  "credential_uuid": "cred_abc123def456",
  "expected_type": "Student ID",  // optional
  "expected_id_number": "STU2024001"  // optional
}
```

**Valid Response:**
```json
{
  "valid": true,
  "credential": {
    "type": "Student ID",
    "id": "cred_abc123def456",
    "issuedAt": "2026-03-04T10:30:00Z",
    "expiresAt": "2027-03-04T10:30:00Z",
    "issuer": "State University",
    "student": {
      "name": "Alice Johnson",
      "idNumber": "STU2024001",
      "enrollmentStatus": "active"
    },
    "attributes": {...}
  },
  "message": "Credential is valid"
}
```

**Invalid Response:**
```json
{
  "valid": false,
  "error": "REVOKED",
  "message": "Credential has been revoked"
}
```

---

### 4. revoke-credential (Admin)

**Endpoint:** `POST /functions/v1/revoke-credential`

Revokes a credential (requires admin JWT).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request:**
```json
{
  "credential_uuid": "cred_abc123def456",
  "reason": "Student requested revocation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential revoked successfully",
  "credentialUuid": "cred_abc123def456"
}
```

---

### 5. admin-students (Admin)

**Endpoint:** `POST /functions/v1/admin-students`

CRUD operations for managing students.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Actions:**

```json
// List students
{
  "action": "list",
  "page": 1,
  "limit": 20,
  "search": "Alice",
  "enrollment_status": "active"
}

// Get single student
{
  "action": "get",
  "id": "uuid-here"
}

// Create student
{
  "action": "create",
  "id_number": "STU2024099",
  "date_of_birth": "2003-01-01",
  "full_name": "New Student",
  "email": "new@student.edu",
  "program": "Computer Science",
  "enrollment_status": "active"
}

// Update student
{
  "action": "update",
  "id": "uuid-here",
  "email": "updated@email.edu",
  "enrollment_status": "graduated"
}

// Delete student
{
  "action": "delete",
  "id": "uuid-here"
}

// Bulk import
{
  "action": "import",
  "students": [
    {"id_number": "STU001", "date_of_birth": "2000-01-01", "full_name": "Student One"},
    {"id_number": "STU002", "date_of_birth": "2000-02-01", "full_name": "Student Two"}
  ]
}
```

---

## Implementation Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your `SUPABASE_URL` and get your `anon` key from Settings → API

### Step 2: Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`

### Step 3: (Optional) Seed Test Data

Run `supabase/seed-data.sql` in the SQL Editor to create test students.

### Step 4: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy all functions
chmod +x supabase/deploy.sh
./supabase/deploy.sh
```

Or deploy individually:
```bash
supabase functions deploy verify-student --no-verify-jwt
supabase functions deploy get-credential --no-verify-jwt
supabase functions deploy validate-credential --no-verify-jwt
supabase functions deploy revoke-credential
supabase functions deploy admin-students
```

### Step 5: Configure Environment

Add to your `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Security Considerations

### 1. Rate Limiting

The `verify-student` function includes built-in rate limiting (10 requests/minute per IP).

### 2. Input Validation

- ID number: 6-20 alphanumeric characters
- Date of birth: YYYY-MM-DD format
- Validation happens server-side before database queries

### 3. Idempotency

Use `idempotency_key` to prevent duplicate credential issuances:
```json
{
  "id_number": "STU2024001",
  "date_of_birth": "2002-03-15",
  "idempotency_key": "unique-request-id"
}
```

### 4. Privacy

- ID numbers in logs are hashed
- Students can opt out of credential issuance
- All verification attempts are logged for audit

### 5. Admin Access

Admin functions require JWT authentication. Admins are managed in the `admin_users` table.

---

## Testing the API

### Test verify-student
```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify-student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "id_number": "STU2024001",
    "date_of_birth": "2002-03-15"
  }'
```

### Test validate-credential
```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-credential \
  -H "Content-Type: application/json" \
  -d '{
    "credential_uuid": "cred_abc123"
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

## Files Overview

| File | Description |
|------|-------------|
| `supabase/migrations/001_initial_schema.sql` | Complete database schema |
| `supabase/functions/verify-student/index.ts` | Main verification & issuance function |
| `supabase/functions/get-credential/index.ts` | Retrieve credentials |
| `supabase/functions/validate-credential/index.ts` | Public credential validation |
| `supabase/functions/revoke-credential/index.ts` | Admin credential revocation |
| `supabase/functions/admin-students/index.ts` | Admin student CRUD |
| `supabase/seed-data.sql` | Test data |
| `supabase/deploy.sh` | Deployment script |

---

## Next Steps

1. **Create Supabase project** (or use existing)
2. **Run schema SQL** in SQL Editor
3. **Deploy Edge Functions** using deploy.sh
4. **Test** with curl using test credentials
5. **Configure issuer** in issuer_config table
6. **Create admin users** for student management
7. **Integrate** into ZeroAuth wallet

---

## Issues Fixed from Original Guide

| Issue | Fix Applied |
|-------|-------------|
| No student management API | Added `admin-students` function |
| Missing verification_logs table | Added to schema |
| Flawed claims logic | Fixed to check student columns first, then attributes |
| Broken RLS policy | Fixed with proper credential_uuid access |
| No credential validation API | Added `validate-credential` function |
| Hardcoded issuer name | Now reads from `issuer_config` |
| No revoke endpoint | Added `revoke-credential` function |
| Missing user_agent logging | Added to all functions |
| No idempotency | Added idempotency_key support |
| Missing indexes | Added for performance |
