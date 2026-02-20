#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd, desc) {
    console.log(`\n🔹 [${desc}] Executando: ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✅ [${desc}] Concluído!`);
    } catch (e) {
        console.error(`❌ [${desc}] Erro ao executar.`);
        // Don't exit process, allow other steps to try
    }
}

console.log('🚀 INICIANDO DEPLOY COMPLETO - NOVIBET PWA\n');

// 1. GIT DEPLOY
run('git add .', 'Git Add');
try {
    // Commit only if changes exist
    execSync('git commit -m "Auto deploy via script"', { stdio: 'ignore' });
    console.log('✅ [Git Commit] Alterações commitadas.');
} catch (e) {
    console.log('ℹ️ [Git Commit] Nada para commitar.');
}
run('git push', 'Git Push');

// 2. VERCEL DEPLOY
run('vercel --prod --yes', 'Vercel Deploy');

// 3. SUPABASE DEPLOY
console.log('\n🔹 [Supabase] Verificando banco de dados...');
run('node deploy_supabase.js', 'Supabase Setup');

console.log('\n✨ DEPLOY FINALIZADO! ✨');
console.log('👉 Verifique as mensagens acima para garantir que tudo ocorreu bem.');
