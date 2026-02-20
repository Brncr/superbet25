const https = require('https');

const PROJECT_REF = 'kurbzeeruouuutlwwpte';
const SERVICE_ROLE_KEY = 'sb_secret_N1qN6Kqkt_-47MzTSgS9Aw_5BLFH6uw';

function request(path) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: `${PROJECT_REF}.supabase.co`,
            path: path,
            method: 'GET',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function check() {
    console.log('Checking table "leads"...');
    try {
        const res = await request('/rest/v1/leads?select=count');
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${res.body}`);
        if (res.status === 200) {
            console.log('TABLE EXISTS!');
        } else {
            console.log('TABLE MISSING or NOT ACCESSIBLE');
        }
    } catch (e) {
        console.error(e);
    }
}

check();
