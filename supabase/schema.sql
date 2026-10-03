-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (RBAC and User Data)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role_id text NOT NULL DEFAULT 'employee', -- 'employee', 'eng_mgr', 'chro'
  role_name text NOT NULL DEFAULT 'Staff Employee',
  department text NOT NULL DEFAULT 'Engineering',
  full_name text,
  employee_id text,
  location text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Evaluations Table
CREATE TABLE evaluations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name text NOT NULL,
  employee_id text,
  department text NOT NULL,
  designation text NOT NULL,
  review_period text NOT NULL,
  status text DEFAULT 'Pending Manager Review' NOT NULL, -- 'Pending Manager Review' or 'Completed'
  
  -- Form Data
  form_data jsonb NOT NULL,
  employee_signature text,
  employee_signed_at timestamp with time zone,
  
  -- Manager Review Data
  manager_id uuid REFERENCES auth.users(id),
  manager_feedback text,
  manager_rating text,
  employee_rating text,
  manager_signature text,
  manager_signed_at timestamp with time zone,
  ai_summary text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Configuration

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Helper function to get the current user's role without triggering infinite recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "All authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Managers and HR policy is redundant as all authenticated users can now read profiles

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Evaluations Policies
CREATE POLICY "Employees can read their own evaluations"
  ON evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers and HR can read evaluations in their department or all"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role_id = 'chro' OR 
        (p.role_id = 'eng_mgr' AND p.department = evaluations.department)
      )
    )
  );

CREATE POLICY "Employees can insert their own evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update evaluations in their department"
  ON evaluations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (
        p.role_id = 'chro' OR 
        (p.role_id = 'eng_mgr' AND p.department = evaluations.department)
      )
    )
  );
CREATE OR REPLACE FUNCTION get_email_by_emp_id(p_employee_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM profiles WHERE employee_id = p_employee_id LIMIT 1;
$$;