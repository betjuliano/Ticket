#!/usr/bin/env node

/**
 * Teste de conexão com MinIO (Domínio Personalizado)
 */

require('dotenv').config({ path: '.env.local' });
const {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} = require('@aws-sdk/client-s3');

async function testMinIOConnection() {
  console.log('🧪 Testando conexão com MinIO...');
  console.log('📍 Endpoint:', `https://${process.env.MINIO_ENDPOINT}`);

  const client = new S3Client({
    endpoint: `https://${process.env.MINIO_ENDPOINT}`,
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
        console.log(`   - ${bucket.Name} (criado em ${bucket.CreationDate})`);
      });
    }

    // Verificar se o bucket ticket-attachments existe
    const bucketName = process.env.MINIO_BUCKET_NAME || 'ticket-attachments';
    console.log(`\n🔍 Verificando bucket '${bucketName}'...`);

    try {
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await client.send(headCommand);
      console.log(`✅ Bucket '${bucketName}' existe e está acessível`);
    } catch (headError) {
      if (headError.name === 'NotFound') {
        console.log(`⚠️  Bucket '${bucketName}' não encontrado`);
        console.log('🔧 Tentando criar bucket...');

        try {
          const createCommand = new CreateBucketCommand({ Bucket: bucketName });
          await client.send(createCommand);
          console.log(`✅ Bucket '${bucketName}' criado com sucesso`);
        } catch (createError) {
          console.log(`❌ Erro ao criar bucket: ${createError.message}`);
        }
      } else {
        console.log(`❌ Erro ao verificar bucket: ${headError.message}`);
      }
    }

    console.log('\n🌐 URLs de acesso:');
    console.log(`   Console: ${process.env.MINIO_CONSOLE_URL}`);
    console.log(`   API: https://${process.env.MINIO_ENDPOINT}`);

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
