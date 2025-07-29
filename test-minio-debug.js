#!/usr/bin/env node

/**
 * Script de debug para testar diferentes configurações do MinIO
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Diferentes combinações para testar
const testConfigs = [
  {
    name: 'Configuração 1: s3.iaprojetos.com.br com minioadmin',
    endpoint: 's3.iaprojetos.com.br',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    useSSL: true,
    port: 443
  },
  {
    name: 'Configuração 2: minio.iaprojetos.com.br com minioadmin',
    endpoint: 'minio.iaprojetos.com.br',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    useSSL: true,
    port: 443
  },
  {
    name: 'Configuração 3: s3.iaprojetos.com.br com credenciais originais',
    endpoint: 's3.iaprojetos.com.br',
    accessKey: 'iaprojetos',
    secretKey: 'Admjuliano1',
    useSSL: true,
    port: 443
  },
  {
    name: 'Configuração 4: minio.iaprojetos.com.br com credenciais originais',
    endpoint: 'minio.iaprojetos.com.br',
    accessKey: 'iaprojetos',
    secretKey: 'Admjuliano1',
    useSSL: true,
    port: 443
  },
  {
    name: 'Configuração 5: s3.iaprojetos.com.br porta 9000',
    endpoint: 's3.iaprojetos.com.br',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    useSSL: false,
    port: 9000
  },
  {
    name: 'Configuração 6: IP direto 207.180.254.250:9000',
    endpoint: '207.180.254.250',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    useSSL: false,
    port: 9000
  }
];

async function testConfig(config) {
  console.log(`\n🧪 Testando: ${config.name}`);
  console.log(`📍 Endpoint: ${config.useSSL ? 'https' : 'http'}://${config.endpoint}:${config.port}`);
  console.log(`🔑 Access Key: ${config.accessKey}`);
  
  const client = new S3Client({
    endpoint: `${config.useSSL ? 'https' : 'http'}://${config.endpoint}:${config.port}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListBucketsCommand({});
    const result = await client.send(listCommand);
    console.log('✅ SUCESSO! Conexão estabelecida');
    console.log(`📦 Buckets encontrados: ${result.Buckets?.length || 0}`);
    
    if (result.Buckets && result.Buckets.length > 0) {
      result.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`❌ FALHOU: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de configuração do MinIO...');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  
  for (const config of testConfigs) {
    const success = await testConfig(config);
    if (success) {
      successCount++;
      console.log('\n🎉 CONFIGURAÇÃO FUNCIONANDO! Use esta configuração no .env.local:');
      console.log(`MINIO_ENDPOINT=${config.endpoint}`);
      console.log(`MINIO_PORT=${config.port}`);
      console.log(`MINIO_USE_SSL=${config.useSSL}`);
      console.log(`MINIO_ACCESS_KEY=${config.accessKey}`);
      console.log(`MINIO_SECRET_KEY=${config.secretKey}`);
      break; // Para no primeiro sucesso
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (successCount === 0) {
    console.log('❌ Nenhuma configuração funcionou.');
    console.log('\n🔧 Próximos passos:');
    console.log('1. Conecte via SSH: ssh root@207.180.254.250');
    console.log('2. Verifique se o MinIO está rodando: docker ps | grep minio');
    console.log('3. Verifique as credenciais: docker logs <container_id>');
    console.log('4. Consulte o arquivo: get-minio-credentials.md');
  } else {
    console.log('✅ Configuração encontrada! Atualize o .env.local com os valores acima.');
  }
}

runAllTests().catch(console.error);