
const https = require('https');

const SUPABASE_URL = 'https://xuykymqkoinksmkhljrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RhS3MyV1wu2fFbe1is04Fg_4lWGWfKs';

const options = {
  hostname: 'xuykymqkoinksmkhljrm.supabase.co',
  path: '/rest/v1/leads?select=count',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
