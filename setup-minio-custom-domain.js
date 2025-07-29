#!/usr/bin/env node

/**
 * Script para configurar MinIO S3 com domínio personalizado
 * Para usar com: https://minio.iaprojetos.com.br
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando MinIO S3 com Domínio Personalizado...');
console.log('📍 Domínio: https://minio.iaprojetos.com.br');

// 1. Verificar se as dependências AWS SDK estão instaladas
console.log('\n📦 Verificando dependências...');
try {
  require('@aws-sdk/client-s3');
  require('@aws-sdk/s3-request-presigner');
  console.log('✅ Dependências AWS SDK já instaladas');
} catch (error) {
  console.log('📥 Instalando dependências AWS SDK...');
  try {
    execSync('npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas com sucesso');
  } catch (installError) {
    console.error('❌ Erro ao instalar dependências:', installError.message);
    process.exit(1);
  }
}

// 2. Atualizar .env.local
console.log('\n🔧 Configurando variáveis de ambiente...');
const envPath = '.env.local';
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Remover configurações MinIO existentes
envContent = envContent.replace(/# MinIO S3 Configuration[\s\S]*?(?=\n\n|\n#|$)/g, '');

// Adicionar novas configurações MinIO
const minioConfig = `
# MinIO S3 Configuration (Domínio Personalizado)
MINIO_ENDPOINT=minio.iaprojetos.com.br
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=seu_access_key_aqui
MINIO_SECRET_KEY=sua_secret_key_aqui
MINIO_BUCKET_NAME=ticket-attachments
MINIO_REGION=us-east-1

# URLs para a aplicação
MINIO_PUBLIC_URL=https://minio.iaprojetos.com.br
MINIO_CONSOLE_URL=https://minio.iaprojetos.com.br/browser
`;

envContent += minioConfig;
fs.writeFileSync(envPath, envContent);
console.log('✅ Variáveis de ambiente atualizadas em .env.local');

// 3. Criar cliente MinIO
console.log('\n📁 Criando cliente MinIO...');
const libDir = 'lib';
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

const minioClientContent = `import { S3Client } from '@aws-sdk/client-s3';

const minioClient = new S3Client({
  endpoint: \`https://\${process.env.MINIO_ENDPOINT}\`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Importante para MinIO
});

export { minioClient };

export const minioConfig = {
  endpoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  bucketName: process.env.MINIO_BUCKET_NAME || 'ticket-attachments',
  region: process.env.MINIO_REGION || 'us-east-1',
  publicUrl: process.env.MINIO_PUBLIC_URL!,
  consoleUrl: process.env.MINIO_CONSOLE_URL!,
};
`;

fs.writeFileSync(path.join(libDir, 'minio-client.ts'), minioClientContent);
console.log('✅ Cliente MinIO criado em lib/minio-client.ts');

// 4. Criar script de teste de conexão
console.log('\n🧪 Criando script de teste...');
const testScript = `#!/usr/bin/env node

/**
 * Teste de conexão com MinIO (Domínio Personalizado)
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListBucketsCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function testMinIOConnection() {
  console.log('🧪 Testando conexão com MinIO...');
  console.log('📍 Endpoint:', \`https://\${process.env.MINIO_ENDPOINT}\`);
  
  const client = new S3Client({
    endpoint: \`https://\${process.env.MINIO_ENDPOINT}\`,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  try {
    // Testar listagem de buckets
    console.log('\n📋 Listando buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResult = await client.send(listCommand);
    console.log('✅ Conexão estabelecida!');
    console.log('📦 Buckets encontrados:', listResult.Buckets?.length || 0);
    
    if (listResult.Buckets) {
      listResult.Buckets.forEach(bucket => {
        console.log(\`   - \${bucket.Name} (criado em \${bucket.CreationDate})\`);
      });
    }

    // Verificar se o bucket ticket-attachments existe
    const bucketName = process.env.MINIO_BUCKET_NAME || 'ticket-attachments';
    console.log(\`\n🔍 Verificando bucket '\${bucketName}'...\`);
    
    try {
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await client.send(headCommand);
      console.log(\`✅ Bucket '\${bucketName}' existe e está acessível\`);
    } catch (headError) {
      if (headError.name === 'NotFound') {
        console.log(\`⚠️  Bucket '\${bucketName}' não encontrado\`);
        console.log('🔧 Tentando criar bucket...');
        
        try {
          const createCommand = new CreateBucketCommand({ Bucket: bucketName });
          await client.send(createCommand);
          console.log(\`✅ Bucket '\${bucketName}' criado com sucesso\`);
        } catch (createError) {
          console.log(\`❌ Erro ao criar bucket: \${createError.message}\`);
        }
      } else {
        console.log(\`❌ Erro ao verificar bucket: \${headError.message}\`);
      }
    }

    console.log('\n🌐 URLs de acesso:');
    console.log(\`   Console: \${process.env.MINIO_CONSOLE_URL}\`);
    console.log(\`   API: https://\${process.env.MINIO_ENDPOINT}\`);
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.log('\n🔧 Verifique:');
    console.log('   1. Se as credenciais estão corretas no .env.local');
    console.log('   2. Se o MinIO está rodando no domínio especificado');
    console.log('   3. Se as permissões de acesso estão configuradas');
    process.exit(1);
  }
}

testMinIOConnection();
`;

fs.writeFileSync('test-minio-custom-domain.js', testScript);
console.log('✅ Script de teste criado: test-minio-custom-domain.js');

// 5. Instruções finais
console.log('\n🎉 Configuração concluída!');
console.log('\n📋 Próximos passos:');
console.log('\n1. 🔑 Atualize as credenciais no .env.local:');
console.log('   - MINIO_ACCESS_KEY=sua_access_key_real');
console.log('   - MINIO_SECRET_KEY=sua_secret_key_real');
console.log('\n2. 🧪 Teste a conexão:');
console.log('   node test-minio-custom-domain.js');
console.log('\n3. 🌐 Acesse o console MinIO:');
console.log('   https://minio.iaprojetos.com.br/browser');
console.log('\n4. 🚀 Use as rotas de API MinIO na sua aplicação:');
console.log('   - Upload: /api/attachments/upload-minio');
console.log('   - Download: /api/attachments/download-minio/[id]');
console.log('\n5. 🎨 Use o componente MinIOFileUpload nos seus forms');
console.log('\n⚠️  Lembre-se de configurar as credenciais corretas antes de testar!');