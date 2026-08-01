-- Migration: Create audit_logs table for full system activity tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read audit logs
CREATE POLICY "Allow authenticated read audit_logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert audit logs
CREATE POLICY "Allow authenticated insert audit_logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
