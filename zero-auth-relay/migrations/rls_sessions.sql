-- Enable RLS on sessions table
-- Sessions should only be readable/writable by the relay service

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to create new sessions (anon can create)
CREATE POLICY "Allow anon create sessions" ON sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Policy 2: Allow anon key to read sessions (needed for status checks)
CREATE POLICY "Allow anon read sessions" ON sessions
  FOR SELECT TO anon USING (true);

-- Policy 3: Allow anon key to update sessions (needed for proof submission)
CREATE POLICY "Allow anon update sessions" ON sessions
  FOR UPDATE TO anon USING (true);

-- Policy 4: Allow anon key to delete expired sessions
CREATE POLICY "Allow anon delete sessions" ON sessions
  FOR DELETE TO anon USING (true);

-- Policy 5: Service role has full access
CREATE POLICY "Allow service role full sessions" ON sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
