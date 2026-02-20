
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xuykymqkoinksmkhljrm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RhS3MyV1wu2fFbe1is04Fg_4lWGWfKs';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
});

async function testAccess() {
    console.log('Testando acesso ANÔNIMO (igual ao dashboard)...');
    const { data, error } = await sb.from('leads').select('*').limit(5);

    if (error) {
        console.error('❌ Erro na consulta:', error);
    } else {
        console.log(`✅ Consulta OK. Leads retornados: ${data.length}`);
        if (data.length > 0) {
            console.log('Lead de exemplo:', data[0].nome);
        } else {
            console.log('⚠️ Retornou vazio! Isso confirma bloqueio por RLS.');
        }
    }
}

testAccess();
