const { S3Client, ListBucketsCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const client = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testMinIOConnection() {
  console.log('🧪 Testando conexão com MinIO...');
  console.log('📍 Endpoint:', `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  
  try {
    // Testar listagem de buckets
    console.log('1. Testando listagem de buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await client.send(listCommand);
    console.log('✅ Buckets encontrados:', listResponse.Buckets?.map(b => b.Name) || []);
    
    // Verificar se bucket ticket-attachments existe
    const bucketExists = listResponse.Buckets?.some(b => b.Name === process.env.MINIO_BUCKET_NAME);
    if (bucketExists) {
      console.log('✅ Bucket ticket-attachments encontrado');
    } else {
      console.log('❌ Bucket ticket-attachments não encontrado');
      console.log('💡 Execute: docker-compose -f docker-compose.minio.yml up -d');
      return;
    }
    
    // Testar upload
    console.log('
2. Testando upload...');
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: 'test/connection-test.txt',
      Body: 'Teste de conexão MinIO - ' + new Date().toISOString(),
      ContentType: 'text/plain',
    });
    
    await client.send(uploadCommand);
    console.log('✅ Upload realizado com sucesso');
    
    // Testar delete
    console.log('
3. Testando delete...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: 'test/connection-test.txt',
    });
    
    await client.send(deleteCommand);
    console.log('✅ Delete realizado com sucesso');
    
    console.log('
🎉 Todos os testes passaram! MinIO está funcionando corretamente.');
    console.log('🌐 Console Web: http://localhost:9001');
    console.log('🔑 Usuário: minioadmin');
    console.log('🔑 Senha: minioadmin123');
    
  } catch (error) {
    console.error('❌ Erro na conexão com MinIO:', error.message);
    console.log('
🔧 Possíveis soluções:');
    console.log('1. Verificar se MinIO está rodando: docker-compose -f docker-compose.minio.yml ps');
    console.log('2. Iniciar MinIO: docker-compose -f docker-compose.minio.yml up -d');
    console.log('3. Verificar logs: docker-compose -f docker-compose.minio.yml logs');
    console.log('4. Verificar variáveis de ambiente no .env.local');
  }
}

testMinIOConnection();
