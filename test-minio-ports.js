#!/usr/bin/env node

/**
 * Script para testar diferentes portas do MinIO
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const http = require('http');

// Portas comuns do MinIO
const commonPorts = [9000, 9001, 443, 80, 8080, 8443];
const endpoints = ['s3.iaprojetos.com.br', 'minio.iaprojetos.com.br'];
const credentials = [
  { access: 'minioadmin', secret: 'minioadmin' },
  { access: 'iaprojetos', secret: 'Admjuliano1' },
  { access: 'admin', secret: 'password' },
  { access: 'minio', secret: 'minio123' }
];

function testConnection(endpoint, port, useSSL) {
  return new Promise((resolve) => {
    const protocol = useSSL ? https : http;
    const url = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/minio/health/live`;
    
    const req = protocol.get(url, { timeout: 5000 }, (res) => {
      resolve({ success: true, status: res.statusCode, endpoint, port, useSSL });
    });
    
    req.on('error', () => {
      resolve({ success: false, endpoint, port, useSSL });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, endpoint, port, useSSL });
    });
  });
}

async function testS3Connection(endpoint, port, useSSL, credentials) {
  const client = new S3Client({
    endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: credentials.access,
      secretAccessKey: credentials.secret,
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListBucketsCommand({});
    const result = await client.send(listCommand);
    return { success: true, buckets: result.Buckets?.length || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function scanPorts() {
  console.log('🔍 Escaneando portas do MinIO...');
  console.log('=' .repeat(60));
  
  const workingEndpoints = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testando endpoint: ${endpoint}`);
    
    for (const port of commonPorts) {
      // Testar HTTPS
      const httpsResult = await testConnection(endpoint, port, true);
      if (httpsResult.success) {
        console.log(`✅ HTTPS ${endpoint}:${port} - Status: ${httpsResult.status}`);
        workingEndpoints.push({ ...httpsResult, protocol: 'https' });
      }
      
      // Testar HTTP
      const httpResult = await testConnection(endpoint, port, false);
      if (httpResult.success) {
        console.log(`✅ HTTP ${endpoint}:${port} - Status: ${httpResult.status}`);
        workingEndpoints.push({ ...httpResult, protocol: 'http' });
      }
    }
  }
  
  return workingEndpoints;
}

async function testCredentials(workingEndpoints) {
  console.log('\n🔑 Testando credenciais nos endpoints funcionais...');
  console.log('=' .repeat(60));
  
  for (const endpoint of workingEndpoints) {
    console.log(`\n🧪 Testando ${endpoint.protocol}://${endpoint.endpoint}:${endpoint.port}`);
    
    for (const cred of credentials) {
      console.log(`   🔐 Testando: ${cred.access}`);
      
      const result = await testS3Connection(
        endpoint.endpoint,
        endpoint.port,
        endpoint.useSSL,
        cred
      );
      
      if (result.success) {
        console.log(`   ✅ SUCESSO! Buckets: ${result.buckets}`);
        console.log('\n🎉 CONFIGURAÇÃO FUNCIONANDO!');
        console.log('Atualize o .env.local com:');
        console.log(`MINIO_ENDPOINT=${endpoint.endpoint}`);
        console.log(`MINIO_PORT=${endpoint.port}`);
        console.log(`MINIO_USE_SSL=${endpoint.useSSL}`);
        console.log(`MINIO_ACCESS_KEY=${cred.access}`);
        console.log(`MINIO_SECRET_KEY=${cred.secret}`);
        return true;
      } else {
        console.log(`   ❌ Falhou: ${result.error}`);
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Iniciando escaneamento completo do MinIO...');
  
  try {
    const workingEndpoints = await scanPorts();
    
    if (workingEndpoints.length === 0) {
      console.log('\n❌ Nenhum endpoint do MinIO encontrado.');
      console.log('\n🔧 Verifique:');
      console.log('1. Se o MinIO está rodando na VPS');
      console.log('2. Se o firewall permite as conexões');
      console.log('3. Se os domínios estão configurados corretamente');
      return;
    }
    
    console.log(`\n📋 Encontrados ${workingEndpoints.length} endpoints funcionais`);
    
    const success = await testCredentials(workingEndpoints);
    
    if (!success) {
      console.log('\n❌ Nenhuma credencial funcionou.');
      console.log('\n🔧 Próximos passos:');
      console.log('1. Conecte via SSH e verifique as credenciais reais');
      console.log('2. Consulte os logs do MinIO');
      console.log('3. Verifique a configuração do MinIO');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o escaneamento:', error.message);
  }
}

main();