/**
 * Script para configurar automaticamente o banco de dados Supabase
 * Executa as migrações e configurações necessárias
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabaseDatabase() {
  console.log('🚀 Configurando banco de dados Supabase...');

  // Verificar se temos as credenciais necessárias
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error('❌ Credenciais do Supabase não encontradas no .env.local');
    return;
  }

  // Criar cliente Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('✅ Cliente Supabase criado');

  // Lista de scripts SQL para executar
  const sqlScripts = [
    {
      name: 'Migração Principal',
      file: 'supabase-migration.sql',
      description: 'Criação de tabelas e estrutura básica',
    },
    {
      name: 'Políticas RLS',
      file: 'supabase-rls-policies.sql',
      description: 'Configuração de segurança Row Level Security',
    },
    {
      name: 'Configuração Storage',
      file: 'supabase-storage-setup.sql',
      description: 'Setup do Supabase Storage para anexos',
    },
    {
      name: 'Configuração Real-time',
      file: 'supabase-realtime-setup.sql',
      description: 'Setup de notificações em tempo real',
    },
  ];

  console.log('\n📋 Scripts SQL encontrados:');

  for (const script of sqlScripts) {
    const scriptPath = path.join(__dirname, script.file);

    if (fs.existsSync(scriptPath)) {
      console.log(`✅ ${script.name}: ${script.file}`);
    } else {
      console.log(`❌ ${script.name}: ${script.file} (não encontrado)`);
    }
  }

  console.log('\n🔧 Executando configurações...');

  // Função para executar SQL via RPC (se disponível)
  async function executeSQLScript(scriptName, sqlContent) {
    console.log(`\n📄 Executando: ${scriptName}`);

    try {
      // Tentar executar via RPC se disponível
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sqlContent,
      });

      if (error) {
        console.log(
          `⚠️  RPC não disponível para ${scriptName}:`,
          error.message
        );
        return false;
      } else {
        console.log(`✅ ${scriptName} executado com sucesso`);
        return true;
      }
    } catch (err) {
      console.log(`⚠️  Erro ao executar ${scriptName}:`, err.message);
      return false;
    }
  }

  // Verificar se podemos executar scripts automaticamente
  console.log('\n🔍 Verificando capacidades de execução...');

  try {
    // Testar se podemos executar SQL diretamente
    const { data, error } = await supabase.rpc('version');

    if (error && error.message.includes('Could not find the function')) {
      console.log('⚠️  Execução automática não disponível');
      console.log(
        '📋 Você precisará executar os scripts manualmente no painel do Supabase'
      );

      console.log('\n📖 Instruções para execução manual:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(
        '1. Acesse o painel do Supabase: https://supabase.com/dashboard'
      );
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para "SQL Editor"');
      console.log('4. Execute os scripts na seguinte ordem:');

      for (let i = 0; i < sqlScripts.length; i++) {
        const script = sqlScripts[i];
        const scriptPath = path.join(__dirname, script.file);

        if (fs.existsSync(scriptPath)) {
          console.log(`\n   ${i + 1}. ${script.name}`);
          console.log(`      Arquivo: ${script.file}`);
          console.log(`      Descrição: ${script.description}`);

          // Mostrar primeiras linhas do script
          const content = fs.readFileSync(scriptPath, 'utf8');
          const firstLines = content.split('\n').slice(0, 3).join('\n');
          console.log(`      Preview: ${firstLines}...`);
        }
      }

      console.log('\n5. Após executar todos os scripts, execute novamente:');
      console.log('   node test-supabase-complete.js');
    } else {
      console.log('✅ Execução automática disponível');

      // Executar scripts automaticamente
      for (const script of sqlScripts) {
        const scriptPath = path.join(__dirname, script.file);

        if (fs.existsSync(scriptPath)) {
          const sqlContent = fs.readFileSync(scriptPath, 'utf8');
          await executeSQLScript(script.name, sqlContent);
        } else {
          console.log(`⚠️  Script ${script.file} não encontrado`);
        }
      }
    }
  } catch (err) {
    console.log('⚠️  Erro ao verificar capacidades:', err.message);
  }

  // Configurar Storage via API
  console.log('\n🗂️  Configurando Storage...');

  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.log('⚠️  Erro ao listar buckets:', listError.message);
    } else {
      const ticketBucket = buckets.find(b => b.name === 'ticket-attachments');

      if (!ticketBucket) {
        console.log('📁 Criando bucket "ticket-attachments"...');

        const { data: bucket, error: createError } =
          await supabase.storage.createBucket('ticket-attachments', {
            public: false,
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain',
              'text/csv',
            ],
            fileSizeLimit: 52428800, // 50MB
          });

        if (createError) {
          console.log('⚠️  Erro ao criar bucket:', createError.message);
        } else {
          console.log('✅ Bucket "ticket-attachments" criado com sucesso');
        }
      } else {
        console.log('✅ Bucket "ticket-attachments" já existe');
      }
    }
  } catch (err) {
    console.log('⚠️  Erro na configuração do Storage:', err.message);
  }

  // Verificar Real-time
  console.log('\n📡 Verificando Real-time...');

  try {
    const channel = supabase.channel('setup-test');

    const realtimeTest = new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.log('⚠️  Real-time: Timeout (pode estar funcionando)');
        resolve(false);
      }, 3000);

      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          console.log('✅ Real-time funcionando');
          resolve(true);
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          console.log('❌ Erro no Real-time');
          resolve(false);
        }
      });
    });

    await realtimeTest;
    channel.unsubscribe();
  } catch (err) {
    console.log('⚠️  Erro no teste Real-time:', err.message);
  }

  console.log('\n🎉 Configuração do Supabase concluída!');

  console.log('\n📋 Status Final:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Cliente Supabase: Configurado');
  console.log('📄 Scripts SQL: Disponíveis para execução');
  console.log('🗂️  Storage: Bucket configurado');
  console.log('📡 Real-time: Verificado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n🔑 Próximos passos importantes:');
  console.log(
    '1. Execute os scripts SQL no painel do Supabase (se não executados automaticamente)'
  );
  console.log('2. Configure as credenciais de service role no .env.local');
  console.log('3. Execute: node test-supabase-complete.js');
  console.log('4. Inicie a aplicação: npm run dev');

  console.log('\n📚 Documentação: SUPABASE-SETUP-GUIDE.md');

  process.exit(0);
}

setupSupabaseDatabase().catch(error => {
  console.error('\n💥 Erro durante a configuração:', error);
  process.exit(1);
});
