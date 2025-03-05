-- Enable RLS on responses and answers tables
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (so we can recreate them)
DROP POLICY IF EXISTS "Allow authenticated users to insert responses" ON responses;
DROP POLICY IF EXISTS "Allow service role to insert responses" ON responses;
DROP POLICY IF EXISTS "Allow response owners to read their responses" ON responses;
DROP POLICY IF EXISTS "Allow service role to read all responses" ON responses;
DROP POLICY IF EXISTS "Allow form owners to read responses" ON responses;

DROP POLICY IF EXISTS "Allow authenticated users to insert answers" ON answers;
DROP POLICY IF EXISTS "Allow service role to insert answers" ON answers;
DROP POLICY IF EXISTS "Allow response owners to read their answers" ON answers;
DROP POLICY IF EXISTS "Allow service role to read all answers" ON answers;

-- Create policies that allow both authenticated and anonymous users to insert records
CREATE POLICY "Allow any user to insert responses" ON responses
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (authenticated or anonymous)

CREATE POLICY "Allow any user to insert answers" ON answers
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (authenticated or anonymous)

-- Allow users to read responses they created (authenticated only)
CREATE POLICY "Allow response owners to read their responses" ON responses
  FOR SELECT
  USING (
    auth.uid() = user_id AND user_id IS NOT NULL
  );

-- Allow users to read their own answers (authenticated only)
CREATE POLICY "Allow response owners to read their answers" ON answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM responses 
      WHERE responses.id = answers.response_id 
      AND responses.user_id = auth.uid()
      AND responses.user_id IS NOT NULL
    )
  );

-- Allow all authenticated users to read all forms and responses
CREATE POLICY "Allow authenticated users to read responses" ON responses
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to read all answers
CREATE POLICY "Allow authenticated users to read answers" ON answers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Service role bypass policies
CREATE POLICY "Allow service role to read all responses" ON responses
  FOR SELECT
  USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Allow service role to read all answers" ON answers
  FOR SELECT
  USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid); 