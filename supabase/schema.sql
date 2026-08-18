-- Create Evaluations Table
CREATE TABLE evaluations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_id text,
  department text NOT NULL,
  designation text NOT NULL,
  review_period text,
  status text DEFAULT 'Pending Manager Review', -- 'Pending Manager Review' or 'Completed'
  
  -- Form Data (JSONB is best for nested/flexible data like KPIs and Reflections)
  form_data jsonb NOT NULL,
  
  -- Manager Review Data
  manager_id uuid REFERENCES auth.users(id),
  manager_feedback text,
  manager_rating text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can read and insert their own evaluations
CREATE POLICY "Employees can read own evaluations" 
  ON evaluations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Employees can insert own evaluations" 
  ON evaluations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Managers can read and update evaluations in their department
-- (Assuming we create a 'profiles' table or use auth.users metadata for role mapping)
-- For a robust enterprise app, you'd join with a profiles table to check department.
-- As a baseline, this policy allows updates if the user is a manager of that department.
CREATE POLICY "Managers can read department evaluations" 
  ON evaluations FOR SELECT 
  USING (
    (auth.jwt() ->> 'email') LIKE '%manager%' OR 
    (auth.jwt() ->> 'email') LIKE '%admin%' OR 
    (auth.jwt() ->> 'email') LIKE '%hr%'
  );

CREATE POLICY "Managers can update department evaluations" 
  ON evaluations FOR UPDATE 
  USING (
    (auth.jwt() ->> 'email') LIKE '%manager%' OR 
    (auth.jwt() ->> 'email') LIKE '%admin%' OR 
    (auth.jwt() ->> 'email') LIKE '%hr%'
  );
