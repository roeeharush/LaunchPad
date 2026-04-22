CREATE TABLE knowledge_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL CHECK (source IN ('trend', 'interview')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own knowledge bookmarks" ON knowledge_bookmarks
  FOR ALL USING (auth.uid() = user_id);
