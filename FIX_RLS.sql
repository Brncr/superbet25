-- RODE ISSO NO SQL EDITOR DO SUPABASE
-- https://supabase.com/dashboard/project/xuykymqkoinksmkhljrm/sql

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select" ON leads;

CREATE POLICY "anon_select" ON leads FOR SELECT TO anon USING (true);
