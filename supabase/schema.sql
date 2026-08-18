-- Create a table for users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  department TEXT,
  designation TEXT,
  manager_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Managers can view their direct reports" ON public.users FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "Admins can view everyone" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.users(id) NOT NULL,
  manager_id UUID REFERENCES public.users(id),
  review_period TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_manager_review', 'completed')),
  employee_data JSONB DEFAULT '{}'::jsonb,  -- Stores Section 1 to 5
  manager_data JSONB DEFAULT '{}'::jsonb,   -- Stores Section 6
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own evaluations" ON public.evaluations 
  FOR ALL USING (auth.uid() = employee_id);
CREATE POLICY "Managers can view and edit their reports evaluations" ON public.evaluations 
  FOR ALL USING (auth.uid() = manager_id);
CREATE POLICY "Admins have full access to all evaluations" ON public.evaluations 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
