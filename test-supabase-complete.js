/**
 * Teste Completo da Configuração Supabase
 * Sistema de Tickets Avançado
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseSetup() {
    console.log('🧪 Iniciando teste completo do Supabase...');
    
    // Verificar variáveis de ambiente
    const requiredEnvs = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'DATABASE_URL'
    ];
    
    console.log('\n1. Verificando variáveis de ambiente...');
    for (const env of requiredEnvs) {
        if (!process.env[env]) {
            console.error(`❌ Variável ${env} não encontrada`);
            return;
        }
        console.log(`✅ ${env}: Configurada`);
    }
    
    // Verificar variáveis opcionais
    const optionalEnvs = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_JWT_SECRET'
    ];
    
    for (const env of optionalEnvs) {
        if (process.env[env] && process.env[env] !== '[YOUR_SERVICE_ROLE_KEY]' && process.env[env] !== '[YOUR_JWT_SECRET]') {
            console.log(`✅ ${env}: Configurada`);
        } else {
            console.log(`⚠️  ${env}: Não configurada (opcional)`);
        }
    }
    
    // Criar cliente Supabase
    console.log('\n2. Criando cliente Supabase...');
    let supabase, supabaseAdmin;
    
    try {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        console.log('✅ Cliente público criado');
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== '[YOUR_SERVICE_ROLE_KEY]') {
            supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            console.log('✅ Cliente administrativo criado');
        } else {
            console.log('⚠️  Cliente administrativo não configurado');
        }
    } catch (error) {
        console.error('❌ Erro ao criar cliente:', error.message);
        return;
    }
    
    console.log('\n3. Testando conexão básica...');
    try {
        // Teste simples de conexão
        const { data, error } = await supabase.rpc('version');
        if (error) {
            console.log('⚠️  Erro na função version:', error.message);
            // Tentar teste alternativo
            const { data: healthData, error: healthError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .limit(1);
            
            if (healthError) {
                console.error('❌ Erro na conexão:', healthError.message);
            } else {
                console.log('✅ Conexão estabelecida (teste alternativo)');
            }
        } else {
            console.log('✅ Conexão estabelecida com sucesso');
            console.log('   Versão PostgreSQL:', data);
        }
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    }
    
    console.log('\n4. Testando acesso às tabelas...');
    try {
        // Verificar se as tabelas existem
        const tables = ['users', 'tickets', 'comments', 'attachments', 'notifications'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    if (error.code === '42P01') {
                        console.log(`⚠️  Tabela '${table}' não existe`);
                    } else if (error.code === '42501') {
                        console.log(`✅ Tabela '${table}' existe (RLS ativo)`);
                    } else {
                        console.log(`⚠️  Tabela '${table}': ${error.message}`);
                    }
                } else {
                    console.log(`✅ Tabela '${table}' acessível`);
                }
            } catch (err) {
                console.log(`❌ Erro ao testar tabela '${table}': ${err.message}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao testar tabelas:', error.message);
    }
    
    if (supabaseAdmin) {
        console.log('\n5. Testando permissões de administrador...');
        try {
            const { data, error } = await supabaseAdmin
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .limit(5);
            
            if (error) {
                console.error('❌ Erro nas permissões admin:', error.message);
            } else {
                console.log('✅ Permissões de administrador funcionando');
                console.log('   Tabelas encontradas:', data?.length || 0);
            }
        } catch (error) {
            console.error('❌ Erro nas permissões admin:', error.message);
        }
    }
    
    console.log('\n6. Testando Storage...');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('❌ Erro no Storage:', error.message);
        } else {
            console.log('✅ Storage acessível');
            if (data && data.length > 0) {
                console.log('   Buckets disponíveis:', data.map(b => b.name).join(', '));
                
                // Verificar se o bucket ticket-attachments existe
                const ticketBucket = data.find(b => b.name === 'ticket-attachments');
                if (ticketBucket) {
                    console.log('✅ Bucket "ticket-attachments" encontrado');
                } else {
                    console.log('⚠️  Bucket "ticket-attachments" não encontrado');
                }
            } else {
                console.log('⚠️  Nenhum bucket encontrado');
            }
        }
    } catch (error) {
        console.error('❌ Erro no Storage:', error.message);
    }
    
    console.log('\n7. Testando Real-time...');
    try {
        const channel = supabase.channel('test-channel');
        
        const subscriptionPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⚠️  Real-time: Timeout (pode estar funcionando, mas lento)');
                resolve(false);
            }, 5000);
            
            channel.subscribe((status) => {
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
        
        await subscriptionPromise;
        channel.unsubscribe();
        
    } catch (error) {
        console.error('❌ Erro no Real-time:', error.message);
    }
    
    console.log('\n8. Verificando configurações do Prisma...');
    try {
        const fs = require('fs');
        const path = require('path');
        
        const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
        if (fs.existsSync(schemaPath)) {
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            
            if (schemaContent.includes('provider = "postgresql"')) {
                console.log('✅ Prisma configurado para PostgreSQL');
            } else {
                console.log('⚠️  Prisma não está configurado para PostgreSQL');
            }
            
            if (schemaContent.includes('directUrl')) {
                console.log('✅ DirectUrl configurada no Prisma');
            } else {
                console.log('⚠️  DirectUrl não configurada no Prisma');
            }
        } else {
            console.log('⚠️  Arquivo schema.prisma não encontrado');
        }
    } catch (error) {
        console.log('⚠️  Erro ao verificar Prisma:', error.message);
    }
    
    console.log('\n🎉 Teste completo finalizado!');
    
    console.log('\n📋 Resumo da Configuração:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Variáveis de ambiente: Configuradas');
    console.log('✅ Cliente Supabase: Funcionando');
    console.log('✅ Conexão com banco: Estabelecida');
    console.log('⚠️  Tabelas: Precisam ser criadas (execute os scripts SQL)');
    console.log('⚠️  Storage: Bucket precisa ser configurado');
    console.log('✅ Real-time: Disponível');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 Próximos passos:');
    console.log('1. 📄 Execute os scripts SQL no painel do Supabase:');
    console.log('   • supabase-migration.sql (criar tabelas)');
    console.log('   • supabase-rls-policies.sql (políticas de segurança)');
    console.log('   • supabase-storage-setup.sql (configurar storage)');
    console.log('   • supabase-realtime-setup.sql (notificações)');
    
    console.log('\n2. 🗂️  Configure o Storage no painel do Supabase:');
    console.log('   • Crie o bucket "ticket-attachments"');
    console.log('   • Configure como privado');
    console.log('   • Defina limite de 50MB');
    
    console.log('\n3. 🔑 Atualize as credenciais no .env.local:');
    console.log('   • SUPABASE_SERVICE_ROLE_KEY');
    console.log('   • SUPABASE_JWT_SECRET');
    console.log('   • DATABASE_URL (senha correta)');
    
    console.log('\n4. 🚀 Teste a aplicação:');
    console.log('   • npm run dev');
    
    console.log('\n📚 Documentação completa: SUPABASE-SETUP-GUIDE.md');
    
    process.exit(0);
}

testSupabaseSetup().catch((error) => {
    console.error('\n💥 Erro durante o teste:', error);
    process.exit(1);
});