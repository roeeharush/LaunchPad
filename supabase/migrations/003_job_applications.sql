CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  location text,
  is_remote boolean NOT NULL DEFAULT false,
  tech_stack jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected')),
  notes text,
  applied_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own job applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);
