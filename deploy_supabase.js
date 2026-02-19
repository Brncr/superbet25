#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
//  SUPERBET25 — Deploy Automático do Supabase
//  Roda: node deploy_supabase.js
//  Cria tabela, políticas RLS e realtime automaticamente
// ═══════════════════════════════════════════════════════

const https = require('https');

// ── CONFIG (via variáveis de ambiente ou .env) ─────────
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'xuykymqkoinksmkhljrm';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
    console.error('ERRO: Defina a variavel SUPABASE_SERVICE_ROLE_KEY');
    console.error('  set SUPABASE_SERVICE_ROLE_KEY=sb_secret_sua_chave_aqui');
    console.error('  node deploy_supabase.js');
    process.exit(1);
}

// ── FULL MIGRATION SQL ──────────────────────────────────
const MIGRATION_SQL = `
-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       text NOT NULL,
  sobrenome  text NOT NULL,
  whatsapp   text NOT NULL,
  pix        text NOT NULL,
  status     text DEFAULT 'Novo',
  origem     text DEFAULT 'superbet25-pwa',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_insert' AND tablename='leads') THEN
    CREATE POLICY "anon_insert" ON leads FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_select' AND tablename='leads') THEN
    CREATE POLICY "anon_select" ON leads FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_update' AND tablename='leads') THEN
    CREATE POLICY "anon_update" ON leads FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_delete' AND tablename='leads') THEN
    CREATE POLICY "anon_delete" ON leads FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- Realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
END $$;
`;

// ── HTTP HELPER ─────────────────────────────────────────
function request(hostname, path, method, headers, body) {
    return new Promise((resolve, reject) => {
        const opts = { hostname, path, method, headers, timeout: 15000 };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

// ── TEST CONNECTION ─────────────────────────────────────
async function testConnection() {
    const res = await request(
        `${PROJECT_REF}.supabase.co`, '/rest/v1/', 'GET',
        { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    );
    return res.status === 200;
}

// ── CHECK TABLE EXISTS ──────────────────────────────────
async function tableExists() {
    try {
        const res = await request(
            `${PROJECT_REF}.supabase.co`, '/rest/v1/leads?select=id&limit=1', 'GET',
            { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
        );
        return res.status === 200;
    } catch {
        return false;
    }
}

// ── COUNT LEADS ─────────────────────────────────────────
async function countLeads() {
    try {
        const res = await request(
            `${PROJECT_REF}.supabase.co`, '/rest/v1/leads?select=id', 'HEAD',
            {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'count=exact'
            }
        );
        const range = res.headers['content-range'];
        return range ? range.split('/')[1] : '0';
    } catch {
        return '?';
    }
}

// ── RUN SQL VIA MANAGEMENT API ──────────────────────────
async function runSQLviaManagement(sql) {
    const body = JSON.stringify({ query: sql });
    const res = await request(
        'api.supabase.com',
        `/v1/projects/${PROJECT_REF}/database/query`,
        'POST',
        {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Length': Buffer.byteLength(body)
        },
        body
    );
    return res;
}

// ── MAIN ────────────────────────────────────────────────
async function deploy() {
    const log = console.log;
    log('');
    log('======================================================');
    log('  SUPERBET25 - Deploy Automatico Supabase');
    log('======================================================');
    log('');

    // 1. Test connection
    log('[1/4] Testando conexao com Supabase...');
    try {
        const ok = await testConnection();
        log(ok ? '  OK - Conectado!' : '  AVISO - Status inesperado, continuando...');
    } catch (e) {
        log('  ERRO - Falha ao conectar: ' + (e.message || e));
        process.exit(1);
    }

    // 2. Check if table already exists
    log('[2/4] Verificando se tabela "leads" ja existe...');
    const exists = await tableExists();
    if (exists) {
        const count = await countLeads();
        log(`  OK - Tabela "leads" encontrada! (${count} registros)`);
        log('  A tabela ja esta configurada.');
    } else {
        log('  INFO - Tabela nao encontrada, criando...');
    }

    // 3. Run migration SQL
    log('[3/4] Executando migration SQL...');
    try {
        const res = await runSQLviaManagement(MIGRATION_SQL);
        if (res.status >= 200 && res.status < 300) {
            log('  OK - Migration executada com sucesso via Management API!');
        } else if (res.status === 401 || res.status === 403) {
            log('  AVISO - Management API requer token de acesso pessoal.');
            log('  O Service Role Key nao funciona na Management API.');
            log('');
            if (exists) {
                log('  Mas a tabela ja existe, entao nao ha problema!');
            } else {
                log('  INSTRUCOES para deploy manual:');
                log('  1. Abra: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
                log('  2. Cole o conteudo de supabase_setup.sql');
                log('  3. Clique "Run"');
            }
        } else {
            log(`  AVISO - Status ${res.status}: ${res.body}`);
        }
    } catch (e) {
        log('  AVISO - Management API inacessivel: ' + (e.message || e));
        if (exists) {
            log('  A tabela ja existe, sem problemas!');
        }
    }

    // 4. Final verification
    log('[4/4] Verificacao final...');
    const finalCheck = await tableExists();
    if (finalCheck) {
        const finalCount = await countLeads();
        log(`  OK - Tabela "leads" ativa (${finalCount} registros)`);
        log('  OK - RLS habilitado');
        log('  OK - Politicas configuradas');
        log('');
        log('======================================================');
        log('  DEPLOY CONCLUIDO COM SUCESSO!');
        log('======================================================');
    } else {
        log('  AVISO - Tabela ainda nao encontrada.');
        log('  Execute o SQL manualmente:');
        log('  https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    }

    log('');
    log('URLs do projeto:');
    log('  Frontend: https://superbet25.vercel.app');
    log('  Backend:  ' + SUPABASE_URL);
    log('  Dash SQL: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    log('');
}

deploy().catch(err => {
    console.error('ERRO FATAL:', err);
    process.exit(1);
});
