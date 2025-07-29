#!/usr/bin/env node

/**
 * Script de Configuração Completa do Supabase
 * Sistema de Tickets Avançado
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração de cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Interface para input do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Configurações do Supabase
let supabaseConfig = {
    url: '',
    anonKey: '',
    serviceRoleKey: '',
    dbPassword: '',
    jwtSecret: ''
};

async function collectSupabaseInfo() {
    logStep('1', 'Coletando informações do Supabase');
    
    log('\nPor favor, forneça as seguintes informações do seu projeto Supabase:', 'yellow');
    log('(Você pode encontrar essas informações no painel do Supabase > Settings > API)', 'yellow');
    
    supabaseConfig.url = await askQuestion('\nURL do Supabase (ex: https://xxx.supabase.co): ');
    supabaseConfig.anonKey = await askQuestion('Anon Key: ');
    supabaseConfig.serviceRoleKey = await askQuestion('Service Role Key: ');
    supabaseConfig.dbPassword = await askQuestion('Senha do banco de dados: ');
    supabaseConfig.jwtSecret = await askQuestion('JWT Secret: ');
    
    logSuccess('Informações coletadas com sucesso!');
}

function updateEnvFile() {
    logStep('2', 'Atualizando arquivo .env.local');
    
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Atualizar configurações do Supabase
    envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${supabaseConfig.url}`
    );
    
    envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseConfig.anonKey}`
    );
    
    envContent = envContent.replace(
        /SUPABASE_SERVICE_ROLE_KEY=.*/,
        `SUPABASE_SERVICE_ROLE_KEY=${supabaseConfig.serviceRoleKey}`
    );
    
    envContent = envContent.replace(
        /SUPABASE_JWT_SECRET=.*/,
        `SUPABASE_JWT_SECRET=${supabaseConfig.jwtSecret}`
    );
    
    // Atualizar DATABASE_URL
    const dbUrl = supabaseConfig.url.replace('https://', '').replace('.supabase.co', '');
    const databaseUrl = `postgresql://postgres:${supabaseConfig.dbPassword}@db.${dbUrl}.supabase.co:5432/postgres`;
    
    envContent = envContent.replace(
        /DATABASE_URL="postgresql:.*"/,
        `DATABASE_URL="${databaseUrl}"`
    );
    
    envContent = envContent.replace(
        /DIRECT_URL="postgresql:.*"/,
        `DIRECT_URL="${databaseUrl}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    logSuccess('Arquivo .env.local atualizado!');
}

function installDependencies() {
    logStep('3', 'Verificando e instalando dependências');
    
    try {
        // Verificar se @supabase/supabase-js está instalado
        execSync('npm list @supabase/supabase-js', { stdio: 'ignore' });
        logSuccess('@supabase/supabase-js já está instalado');
    } catch {
        log('Instalando @supabase/supabase-js...', 'yellow');
        execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
        logSuccess('@supabase/supabase-js instalado!');
    }
    
    try {
        // Verificar se prisma está instalado
        execSync('npm list prisma', { stdio: 'ignore' });
        logSuccess('Prisma já está instalado');
    } catch {
        log('Instalando Prisma...', 'yellow');
        execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
        logSuccess('Prisma instalado!');
    }
}

function updatePrismaSchema() {
    logStep('4', 'Atualizando schema do Prisma para PostgreSQL');
    
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
        logError('Arquivo prisma/schema.prisma não encontrado!');
        return;
    }
    
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Atualizar provider para postgresql
    schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/g,
        'provider = "postgresql"'
    );
    
    // Adicionar directUrl se não existir
    if (!schemaContent.includes('directUrl')) {
        schemaContent = schemaContent.replace(
            /(datasource db \{[^}]*url\s*=\s*env\("DATABASE_URL"\))/,
            '$1\n  directUrl = env("DIRECT_URL")'
        );
    }
    
    fs.writeFileSync(schemaPath, schemaContent);
    logSuccess('Schema do Prisma atualizado para PostgreSQL!');
}

function runDatabaseMigration() {
    logStep('5', 'Executando migrações do banco de dados');
    
    try {
        log('Gerando cliente Prisma...', 'yellow');
        execSync('npx prisma generate', { stdio: 'inherit' });
        logSuccess('Cliente Prisma gerado!');
        
        log('Aplicando migrações...', 'yellow');
        execSync('npx prisma db push', { stdio: 'inherit' });
        logSuccess('Migrações aplicadas!');
        
    } catch (error) {
        logError('Erro ao executar migrações:');
        console.error(error.message);
        logWarning('Você pode executar manualmente: npx prisma db push');
    }
}

function createSupabaseClient() {
    logStep('6', 'Criando cliente Supabase');
    
    const clientPath = path.join(__dirname, 'lib', 'supabase-client.js');
    const libDir = path.dirname(clientPath);
    
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
    }
    
    const clientContent = `
/**
 * Cliente Supabase Configurado
 * Sistema de Tickets Avançado
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente público (para uso no frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Cliente administrativo (para uso no backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funções utilitárias
export const supabaseUtils = {
  // Upload de arquivo
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  },
  
  // Download de arquivo
  async downloadFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) throw error;
    return data;
  },
  
  // URL pública do arquivo
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },
  
  // URL assinada do arquivo
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  }
};

// Tipos TypeScript para o banco
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'COORDINATOR' | 'USER';
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'WAITING_FOR_THIRD_PARTY' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
          category: string;
          tags: string;
          createdById: string;
          assignedToId: string | null;
          createdAt: string;
          updatedAt: string;
          closedAt: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
    };
  };
};
`;
    
    fs.writeFileSync(clientPath, clientContent);
    logSuccess('Cliente Supabase criado!');
}

function createTestScript() {
    logStep('7', 'Criando script de teste');
    
    const testPath = path.join(__dirname, 'test-supabase-complete.js');
    
    const testContent = `
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
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL'
    ];
    
    console.log('\n1. Verificando variáveis de ambiente...');
    for (const env of requiredEnvs) {
        if (!process.env[env]) {
            console.error(\`❌ Variável \${env} não encontrada\`);
            return;
        }
        console.log(\`✅ \${env}: Configurada\`);
    }
    
    // Criar cliente Supabase
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('\n2. Testando conexão básica...');
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.error('❌ Erro na conexão:', error.message);
        } else {
            console.log('✅ Conexão estabelecida com sucesso');
        }
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    }
    
    console.log('\n3. Testando permissões de administrador...');
    try {
        const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
        if (error) {
            console.error('❌ Erro nas permissões admin:', error.message);
        } else {
            console.log('✅ Permissões de administrador funcionando');
        }
    } catch (error) {
        console.error('❌ Erro nas permissões admin:', error.message);
    }
    
    console.log('\n4. Testando Storage...');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('❌ Erro no Storage:', error.message);
        } else {
            console.log('✅ Storage acessível');
            console.log('Buckets disponíveis:', data.map(b => b.name).join(', '));
        }
    } catch (error) {
        console.error('❌ Erro no Storage:', error.message);
    }
    
    console.log('\n5. Testando Real-time...');
    try {
        const channel = supabase.channel('test-channel');
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Real-time funcionando');
                channel.unsubscribe();
            }
        });
    } catch (error) {
        console.error('❌ Erro no Real-time:', error.message);
    }
    
    console.log('\n🎉 Teste completo finalizado!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute os scripts SQL para criar as tabelas e políticas');
    console.log('2. Configure o Storage bucket "ticket-attachments"');
    console.log('3. Teste a aplicação completa');
    
    process.exit(0);
}

testSupabaseSetup().catch(console.error);
`;
    
    fs.writeFileSync(testPath, testContent);
    logSuccess('Script de teste criado!');
}

function showNextSteps() {
    logStep('8', 'Configuração concluída!');
    
    log('\n🎉 Configuração do Supabase concluída com sucesso!', 'green');
    log('\n📋 Próximos passos:', 'cyan');
    log('\n1. Execute os scripts SQL no painel do Supabase:', 'yellow');
    log('   - supabase-migration.sql (criar tabelas)', 'white');
    log('   - supabase-rls-policies.sql (políticas de segurança)', 'white');
    log('   - supabase-storage-setup.sql (configurar storage)', 'white');
    log('   - supabase-realtime-setup.sql (notificações em tempo real)', 'white');
    
    log('\n2. Teste a configuração:', 'yellow');
    log('   node test-supabase-complete.js', 'white');
    
    log('\n3. Configure o bucket de storage no painel do Supabase:', 'yellow');
    log('   - Nome: ticket-attachments', 'white');
    log('   - Público: Não', 'white');
    log('   - Limite de arquivo: 50MB', 'white');
    
    log('\n4. Inicie a aplicação:', 'yellow');
    log('   npm run dev', 'white');
    
    log('\n📚 Documentação adicional:', 'cyan');
    log('   - Supabase: https://supabase.com/docs', 'white');
    log('   - Prisma: https://www.prisma.io/docs', 'white');
    
    log('\n✨ Sua aplicação agora está configurada para usar o Supabase!', 'green');
}

async function main() {
    try {
        log('🚀 Configuração Automática do Supabase', 'bright');
        log('Sistema de Tickets Avançado\n', 'bright');
        
        await collectSupabaseInfo();
        updateEnvFile();
        installDependencies();
        updatePrismaSchema();
        runDatabaseMigration();
        createSupabaseClient();
        createTestScript();
        showNextSteps();
        
    } catch (error) {
        logError('Erro durante a configuração:');
        console.error(error);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    collectSupabaseInfo,
    updateEnvFile,
    installDependencies,
    updatePrismaSchema,
    runDatabaseMigration,
    createSupabaseClient,
    createTestScript
};