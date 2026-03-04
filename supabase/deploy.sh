#!/bin/bash
# ============================================================================
# Supabase Student Verification System - Deployment Script
# ============================================================================
# This script deploys all Edge Functions to your Supabase project
# 
# Prerequisites:
# 1. Install Supabase CLI: npm install -g supabase
# 2. Login: supabase login
# 3. Link to project: supabase link --project-ref YOUR_PROJECT_REF
# ============================================================================

set -e

echo "=========================================="
echo "Supabase Student Verification Deployment"
echo "=========================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if linked to a project
echo ""
echo "📋 Checking Supabase project link..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run: supabase login"
    exit 1
fi

# Get current project ref
PROJECT_REF=$(supabase projects list | head -n 1 | awk '{print $1}' | grep -E '^[a-z]{20}$' || echo "")
if [ -z "$PROJECT_REF" ]; then
    echo "⚠️  No Supabase project linked."
    echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "   To find your project ref:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Project settings (⚙️)"
    echo "   4. General -> Reference ID"
    exit 1
fi

echo "✅ Linked to project: $PROJECT_REF"

# Deploy Edge Functions
echo ""
echo "🚀 Deploying Edge Functions..."

echo "   📤 verify-student..."
supabase functions deploy verify-student --no-verify-jwt

echo "   📤 get-credential..."
supabase functions deploy get-credential --no-verify-jwt

echo "   📤 validate-credential..."
supabase functions deploy validate-credential --no-verify-jwt

echo "   📤 revoke-credential..."
supabase functions deploy revoke-credential

echo "   📤 admin-students..."
supabase functions deploy admin-students

echo ""
echo "✅ All Edge Functions deployed!"

# Get API keys
echo ""
echo "📋 Configuration:"
echo "   SUPABASE_URL: https://$PROJECT_REF.supabase.co"
echo "   SUPABASE_ANON_KEY: (Get from Settings -> API in Supabase dashboard)"
echo ""
echo "   To get your anon key:"
echo "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo "   2. Copy 'anon' key under 'Project API keys'"
echo ""
echo "   To test the verify-student function:"
echo "   curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/verify-student \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -d '{\"id_number\": \"STU2024001\", \"date_of_birth\": \"2002-03-15\"}'"
echo ""
echo "=========================================="
echo "Deployment complete! 🎉"
echo "=========================================="
