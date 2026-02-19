
const https = require('https');

// Config do Supabase
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'xuykymqkoinksmkhljrm';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_RhS3MyV1wu2fFbe1is04Fg_4lWGWfKs';
const HOST = `${PROJECT_REF}.supabase.co`;

function getLeads() {
    const options = {
        hostname: HOST,
        path: '/rest/v1/leads?select=*&order=created_at.desc&limit=5', // Pega os últimos 5
        method: 'GET',
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const leads = JSON.parse(data);
                console.log('\n🔍 ÚLTIMOS LEADS REGISTRADOS:');
                console.log('-----------------------------');
                if (leads.length === 0) {
                    console.log('Nenhum lead encontrado ainda.');
                } else {
                    leads.forEach(l => {
                        console.log(`[${new Date(l.created_at).toLocaleString('pt-BR')}] ${l.nome} ${l.sobrenome} - ${l.whatsapp} (${l.status})`);
                    });
                }
                console.log('-----------------------------');
            } catch (e) {
                console.error('Erro ao processar resposta:', e);
                console.log('Raw data:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Erro na requisição:', e);
    });
    req.end();
}

getLeads();
