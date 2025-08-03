/**
 * Script Interativo - Próximos Passos Supabase
 * Guia passo a passo para finalizar a configuração
 */

require('dotenv').config({ path: '.env.local' });
const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function proximosPasso() {
  console.clear();
  console.log('🚀 PRÓXIMOS PASSOS - CONFIGURAÇÃO SUPABASE');
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📋 STATUS ATUAL:');
  console.log('✅ Scripts SQL criados');
  console.log('✅ Configuração inicial completa');
  console.log('⚠️  Execução manual necessária');

  console.log('\n🎯 O QUE VOCÊ PRECISA FAZER AGORA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Passo 1: Abrir Supabase
  console.log('\n1️⃣  EXECUTAR SCRIPTS SQL NO SUPABASE');
  console.log('   📍 Acesse: https://supabase.com/dashboard');
  console.log('   📍 Selecione seu projeto');
  console.log('   📍 Vá para "SQL Editor"');

  const abrirSupabase = await askQuestion(
    '\n❓ Deseja abrir o painel do Supabase agora? (s/n): '
  );

  if (
    abrirSupabase.toLowerCase() === 's' ||
    abrirSupabase.toLowerCase() === 'sim'
  ) {
    console.log('🌐 Abrindo painel do Supabase...');
    exec('start https://supabase.com/dashboard', error => {
      if (error) {
        console.log(
          '⚠️  Não foi possível abrir automaticamente. Acesse: https://supabase.com/dashboard'
        );
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Mostrar scripts para executar
  console.log('\n📄 SCRIPTS PARA EXECUTAR (NA ORDEM):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const scripts = [
    {
      ordem: '1º',
      nome: 'supabase-migration.sql',
      descricao: 'Cria tabelas e estrutura básica',
      cor: '🟢',
    },
    {
      ordem: '2º',
      nome: 'supabase-rls-policies.sql',
      descricao: 'Configura segurança (RLS)',
      cor: '🔒',
    },
    {
      ordem: '3º',
      nome: 'supabase-storage-setup.sql',
      descricao: 'Configura storage para anexos',
      cor: '📁',
    },
    {
      ordem: '4º',
      nome: 'supabase-realtime-setup.sql',
      descricao: 'Configura notificações em tempo real',
      cor: '⚡',
    },
  ];

  scripts.forEach(script => {
    console.log(`${script.cor} ${script.ordem} ${script.nome}`);
    console.log(`   └─ ${script.descricao}`);

    // Verificar se o arquivo existe
    if (fs.existsSync(script.nome)) {
      console.log(`   ✅ Arquivo encontrado`);
    } else {
      console.log(`   ❌ Arquivo não encontrado`);
    }
    console.log('');
  });

  // Passo 2: Storage
  console.log('\n2️⃣  CONFIGURAR STORAGE');
  console.log('   📍 No painel do Supabase, vá para "Storage"');
  console.log('   📍 Clique em "Create Bucket"');
  console.log('   📍 Nome: ticket-attachments');
  console.log('   📍 Privado: ✅ Sim');
  console.log('   📍 Tamanho máximo: 50MB');

  // Passo 3: Credenciais
  console.log('\n3️⃣  OBTER CREDENCIAIS');
  console.log('   📍 No painel do Supabase, vá para "Settings" → "API"');
  console.log('   📍 Copie: service_role (secret)');
  console.log('   📍 Copie: JWT Secret');
  console.log('   📍 Atualize o arquivo .env.local');

  // Verificar .env.local atual
  console.log('\n🔍 VERIFICANDO .ENV.LOCAL ATUAL:');
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');

    const hasServiceRole =
      envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') &&
      !envContent.includes('[YOUR_SERVICE_ROLE_KEY]');
    const hasJwtSecret =
      envContent.includes('SUPABASE_JWT_SECRET=') &&
      !envContent.includes('[YOUR_JWT_SECRET]');
    const hasDatabaseUrl =
      envContent.includes('DATABASE_URL=') &&
      envContent.includes('postgresql://');

    console.log(
      `   ${hasServiceRole ? '✅' : '⚠️ '} SUPABASE_SERVICE_ROLE_KEY`
    );
    console.log(`   ${hasJwtSecret ? '✅' : '⚠️ '} SUPABASE_JWT_SECRET`);
    console.log(`   ${hasDatabaseUrl ? '✅' : '⚠️ '} DATABASE_URL`);

    if (!hasServiceRole || !hasJwtSecret) {
      console.log('\n   ⚠️  Credenciais precisam ser atualizadas!');
    }
  } catch (error) {
    console.log('   ❌ Erro ao ler .env.local');
  }

  // Passo 4: Teste
  console.log('\n4️⃣  TESTAR CONFIGURAÇÃO');
  console.log('   📍 Execute: node test-supabase-complete.js');

  const executarTeste = await askQuestion(
    '\n❓ Deseja executar o teste agora? (s/n): '
  );

  if (
    executarTeste.toLowerCase() === 's' ||
    executarTeste.toLowerCase() === 'sim'
  ) {
    console.log('\n🧪 Executando teste...');

    exec('node test-supabase-complete.js', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro no teste:', error.message);
        return;
      }
      if (stderr) {
        console.log('⚠️  Aviso:', stderr);
      }
      console.log(stdout);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Passo 5: Iniciar aplicação
  console.log('\n5️⃣  INICIAR APLICAÇÃO');
  console.log('   📍 Execute: npm run dev');

  const iniciarApp = await askQuestion(
    '\n❓ Deseja iniciar a aplicação agora? (s/n): '
  );

  if (iniciarApp.toLowerCase() === 's' || iniciarApp.toLowerCase() === 'sim') {
    console.log('\n🚀 Iniciando aplicação...');
    console.log('   Aguarde alguns segundos...');

    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro ao iniciar:', error.message);
        return;
      }
      console.log('✅ Aplicação iniciada!');
      console.log('🌐 Acesse: http://localhost:3000');
    });
  }

  console.log('\n📚 DOCUMENTAÇÃO COMPLETA:');
  console.log('   📄 CONFIGURACAO-FINAL-SUPABASE.md');
  console.log('   📄 SUPABASE-SETUP-GUIDE.md');

  console.log('\n🎉 RESUMO DOS PRÓXIMOS PASSOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Executar 4 scripts SQL no painel do Supabase');
  console.log('2. Criar bucket "ticket-attachments" no Storage');
  console.log('3. Obter e configurar credenciais no .env.local');
  console.log('4. Executar teste: node test-supabase-complete.js');
  console.log('5. Iniciar aplicação: npm run dev');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(
    '\n✨ Após completar estes passos, seu sistema estará 100% funcional!'
  );

  rl.close();
}

proximosPasso().catch(console.error);
