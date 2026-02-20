-- =============================================
-- 🚨 INSTRUÇÃO OBRIGATÓRIA 🚨
-- 1. Acesse: https://supabase.com/dashboard/project/kurbzeeruouuutlwwpte/sql
-- 2. Clique em "New Query"
-- 3. Cole TODO este conteúdo e clique em "Run"
-- =============================================

-- 1. Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       text NOT NULL,
  sobrenome  text NOT NULL,
  whatsapp   text NOT NULL,
  pix        text NOT NULL,
  status     text DEFAULT 'Novo',
  origem     text DEFAULT 'novibet-pwa',
  created_at timestamptz DEFAULT now()
);

-- 2. Habilitar Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso (anon pode tudo — ajuste conforme necessário)
CREATE POLICY "anon_insert" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update" ON leads FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_delete" ON leads FOR DELETE TO anon USING (true);

-- 4. Habilitar Realtime (necessário para o dashboard atualizar ao vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
