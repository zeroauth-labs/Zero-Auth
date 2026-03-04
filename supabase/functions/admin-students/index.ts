/**
 * Admin Student Management Edge Function
 * 
 * CRUD operations for managing students.
 * Requires admin authentication via JWT.
 * 
 * Endpoints:
 * - GET /?action=list - List students (with pagination)
 * - GET /?action=get&id=UUID - Get single student
 * - POST /?action=create - Create student
 * - PUT /?action=update - Update student
 * - DELETE /?action=delete - Delete student
 * - POST /?action=import - Bulk import students
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'import';
  // For list
  page?: number;
  limit?: number;
  search?: string;
  enrollment_status?: string;
  // For get/update_delete
  id?: string;
  // For create_update
  id_number?: string;
  date_of_birth?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  program?: string;
  department?: string;
  enrollment_year?: number;
  graduation_year?: number;
  enrollment_status?: string;
  attributes?: Record<string, any>;
  allow_credential_issuance?: boolean;
  // For import
  students?: Array<{
    id_number: string;
    date_of_birth: string;
    full_name: string;
    email?: string;
    program?: string;
  }>;
}

// Helper to verify admin
async function verifyAdmin(supabase: any, authHeader: string): Promise<{ isAdmin: boolean; adminId?: string; role?: string; error?: string }> {
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user?.email) {
      return { isAdmin: false, error: 'Invalid token' };
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return { isAdmin: false, error: 'Not authorized' };
    }

    return { isAdmin: true, adminId: admin.id, role: admin.role };
  } catch (e) {
    return { isAdmin: false, error: 'Auth check failed' };
  }
}

// List students
async function listStudents(supabase: any, params: { page?: number; limit?: number; search?: string; enrollment_status?: string }) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,id_number.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  if (params.enrollment_status) {
    query = query.eq('enrollment_status', params.enrollment_status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    students: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

// Get single student
async function getStudent(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('Student not found');
  return data;
}

// Create student
async function createStudent(supabase: any, data: any, adminId: string) {
  // Check for duplicate ID number
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('id_number', data.id_number?.toUpperCase())
    .single();

  if (existing) {
    throw new Error('Student with this ID number already exists');
  }

  const { data: student, error } = await supabase
    .from('students')
    .insert({
      ...data,
      id_number: data.id_number?.toUpperCase(),
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: adminId
    })
    .select()
    .single();

  if (error) throw error;
  return student;
}

// Update student
async function updateStudent(supabase: any, id: string, data: any) {
  const { data: student, error } = await supabase
    .from('students')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return student;
}

// Delete student
async function deleteStudent(supabase: any, id: string) {
  // This will cascade delete issued_credentials due to foreign key
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// Bulk import students
async function importStudents(supabase: any, students: Array<any>, adminId: string) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const student of students) {
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('id_number', student.id_number?.toUpperCase())
        .single();

      if (existing) {
        results.failed++;
        results.errors.push(`Duplicate ID: ${student.id_number}`);
        continue;
      }

      const { error } = await supabase
        .from('students')
        .insert({
          id_number: student.id_number?.toUpperCase(),
          date_of_birth: student.date_of_birth,
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          program: student.program,
          department: student.department,
          enrollment_year: student.enrollment_year,
          enrollment_status: student.enrollment_status || 'active',
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminId
        });

      if (error) throw error;
      results.success++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(`${student.id_number}: ${e.message}`);
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminCheck = await verifyAdmin(supabase, authHeader);
    if (!adminCheck.isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'FORBIDDEN', message: adminCheck.error || 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check role permissions for write operations
    const isReadOnly = adminCheck.role === 'readonly';

    // Parse request
    const body: RequestBody = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'list':
        result = await listStudents(supabase, {
          page: body.page,
          limit: body.limit,
          search: body.search,
          enrollment_status: body.enrollment_status
        });
        break;

      case 'get':
        if (!body.id) throw new Error('Student ID required');
        result = await getStudent(supabase, body.id);
        break;

      case 'create':
        if (isReadOnly) throw new Error('Read-only admin cannot create students');
        result = await createStudent(supabase, body, adminCheck.adminId!);
        break;

      case 'update':
        if (isReadOnly) throw new Error('Read-only admin cannot update students');
        if (!body.id) throw new Error('Student ID required');
        result = await updateStudent(supabase, body.id, body);
        break;

      case 'delete':
        if (isReadOnly) throw new Error('Read-only admin cannot delete students');
        if (!body.id) throw new Error('Student ID required');
        result = await deleteStudent(supabase, body.id);
        break;

      case 'import':
        if (isReadOnly) throw new Error('Read-only admin cannot import students');
        if (!body.students || !Array.isArray(body.students)) throw new Error('Students array required');
        result = await importStudents(supabase, body.students, adminCheck.adminId!);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'SERVER_ERROR',
        message: error.message || 'An unexpected error occurred'
      }),
      { status: error.message?.includes('required') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
