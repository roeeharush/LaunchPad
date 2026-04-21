-- Resume analyses
CREATE TABLE resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_url text NOT NULL,
  extracted_text text,
  analysis_json jsonb,
  score integer CHECK (score >= 0 AND score <= 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own resumes" ON resumes
  FOR ALL USING (auth.uid() = user_id);

-- Profile analyses (LinkedIn + GitHub)
CREATE TABLE profile_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL CHECK (type IN ('linkedin', 'github')),
  input_text text,
  result_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profile_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own profile analyses" ON profile_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Job listing analyses
CREATE TABLE job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  listing_text text NOT NULL,
  cover_letter text,
  tips_json jsonb,
  status text DEFAULT 'analyzed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own job analyses" ON job_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Trend bookmarks
CREATE TABLE trend_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  trend_id text NOT NULL,
  status text DEFAULT 'bookmarked' CHECK (status IN ('bookmarked', 'learning', 'done')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, trend_id)
);

ALTER TABLE trend_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own bookmarks" ON trend_bookmarks
  FOR ALL USING (auth.uid() = user_id);
