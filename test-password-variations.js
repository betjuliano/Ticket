#!/usr/bin/env node

/**
 * Script para testar variações da senha do MinIO
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Variações da senha para testar
const passwordVariations = [
  'Admjuliano1',
  'admjuliano1',
  'ADMJULIANO1',
  'AdmJuliano1',
  'Admjuliano1!',
  'Admjuliano@1',
  'Admjuliano#1',
  'Admjuliano$1',
  'Admjuliano_1',
  'Admjuliano-1',
  'Admjuliano01',
  'Admjuliano123',
  'iaprojetos',
  'iaprojetos123',
  'Iaprojetos1',
  'IAPROJETOS1',
  'iaprojetos@123',
  'admin123',
  'password',
  'password123',
  'minio123',
  'minioadmin',
];

async function testPassword(accessKey, secretKey) {
  const client = new S3Client({
    endpoint: 'https://s3.iaprojetos.com.br:443',
    region: 'us-east-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListBucketsCommand({});
    const result = await client.send(listCommand);
    return {
      success: true,
      buckets: result.Buckets?.length || 0,
      bucketsData: result.Buckets,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔐 Testando variações de senha para o usuário "iaprojetos"...');
  console.log('📍 Endpoint: https://s3.iaprojetos.com.br:443');
  console.log('='.repeat(60));

  let foundWorking = false;

  for (const password of passwordVariations) {
    console.log(`\n🧪 Testando senha: ${password}`);

    const result = await testPassword('iaprojetos', password);

    if (result.success) {
      console.log('✅ SUCESSO! Credenciais funcionando!');
      console.log(`📦 Buckets encontrados: ${result.buckets}`);

      if (result.bucketsData && result.bucketsData.length > 0) {
        console.log('📋 Lista de buckets:');
        result.bucketsData.forEach(bucket => {
          console.log(
            `   - ${bucket.Name} (criado em: ${bucket.CreationDate})`
          );
        });
      }

      console.log('\n🎉 CONFIGURAÇÃO CORRETA ENCONTRADA!');
      console.log('Atualize o .env.local com:');
      console.log(`MINIO_ACCESS_KEY=iaprojetos`);
      console.log(`MINIO_SECRET_KEY=${password}`);
      console.log(`MINIO_ENDPOINT=s3.iaprojetos.com.br`);
      console.log(`MINIO_PORT=443`);
      console.log(`MINIO_USE_SSL=true`);

      foundWorking = true;
      break;
    } else {
      // Classificar o tipo de erro
      if (result.error.includes('does not exist in our records')) {
        console.log('❌ Access Key não existe');
      } else if (
        result.error.includes('signature we calculated does not match')
      ) {
        console.log('⚠️  Access Key existe, mas senha incorreta');
      } else if (result.error.includes('Access Denied')) {
        console.log('🚫 Acesso negado');
      } else {
        console.log(`❌ Erro: ${result.error}`);
      }
    }

    // Pequena pausa para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!foundWorking) {
    console.log('\n❌ Nenhuma variação de senha funcionou.');
    console.log('\n🔧 Próximos passos:');
    console.log('1. Conecte via SSH: ssh root@207.180.254.250');
    console.log('2. Verifique as credenciais reais do MinIO');
    console.log('3. Consulte os logs: docker logs <minio_container>');
    console.log(
      '4. Verifique variáveis de ambiente: docker inspect <minio_container>'
    );
  }
}

main().catch(console.error);
