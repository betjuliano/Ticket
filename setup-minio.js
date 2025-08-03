#!/usr/bin/env node

/**
 * Script de Configuração Automatizada do MinIO S3
 * Sistema de Tickets - Configuração de Storage
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MinIOSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join(this.projectRoot, '.env.local');
    this.dockerComposeFile = path.join(
      this.projectRoot,
      'docker-compose.minio.yml'
    );
  }

  // Verificar se Docker está instalado
  checkDocker() {
    try {
      execSync('docker --version', { stdio: 'ignore' });
      console.log('✅ Docker encontrado');
      return true;
    } catch (error) {
      console.log('❌ Docker não encontrado. Instale o Docker primeiro.');
      return false;
    }
  }

  // Verificar se Node.js tem as dependências necessárias
  checkDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ package.json não encontrado');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const requiredDeps = [
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
    ];
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);

    if (missingDeps.length > 0) {
      console.log('📦 Instalando dependências necessárias...');
      try {
        execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
        console.log('✅ Dependências instaladas');
      } catch (error) {
        console.log('❌ Erro ao instalar dependências:', error.message);
        return false;
      }
    } else {
      console.log('✅ Dependências já instaladas');
    }

    return true;
  }

  // Criar arquivo docker-compose para MinIO
  createDockerCompose() {
    const dockerComposeContent = `version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio-storage
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console Web
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_CONSOLE_ADDRESS: ":9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - ticket-network
    restart: unless-stopped

  # Cliente MinIO para configuração inicial
  minio-client:
    image: minio/mc:latest
    container_name: minio-client
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      echo 'Aguardando MinIO iniciar...';
      sleep 15;
      echo 'Configurando MinIO...';
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/ticket-attachments --ignore-existing;
      /usr/bin/mc policy set download myminio/ticket-attachments;
      echo 'Configuração concluída!';
      exit 0;
      "
    networks:
      - ticket-network

volumes:
  minio_data:

networks:
  ticket-network:
    driver: bridge
`;

    fs.writeFileSync(this.dockerComposeFile, dockerComposeContent);
    console.log('✅ Arquivo docker-compose.minio.yml criado');
  }

  // Atualizar arquivo .env.local
  updateEnvFile() {
    const minioEnvVars = `
# MinIO S3 Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=ticket-attachments
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_PUBLIC_URL=http://localhost:9000
`;

    if (fs.existsSync(this.envFile)) {
      const envContent = fs.readFileSync(this.envFile, 'utf8');

      // Verificar se já tem configuração do MinIO
      if (envContent.includes('MINIO_ENDPOINT')) {
        console.log('⚠️  Configuração MinIO já existe no .env.local');
        return;
      }

      // Adicionar configuração do MinIO
      fs.appendFileSync(this.envFile, minioEnvVars);
      console.log('✅ Configuração MinIO adicionada ao .env.local');
    } else {
      // Criar arquivo .env.local
      fs.writeFileSync(this.envFile, minioEnvVars.trim());
      console.log('✅ Arquivo .env.local criado com configuração MinIO');
    }
  }

  // Criar cliente MinIO
  createMinIOClient() {
    const libDir = path.join(this.projectRoot, 'lib');
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }

    const clientPath = path.join(libDir, 'minio-client.ts');

    if (fs.existsSync(clientPath)) {
      console.log('⚠️  Arquivo minio-client.ts já existe');
      return;
    }

    const clientContent = `import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: \`http\${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://\${process.env.MINIO_ENDPOINT}:\${process.env.MINIO_PORT}\`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Necessário para MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME!;

export class MinIOService {
  // Upload de arquivo
  static async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const key = \`attachments/\${Date.now()}-\${fileName}\`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);
    
    // Retorna URL pública
    return \`\${process.env.MINIO_PUBLIC_URL}/\${BUCKET_NAME}/\${key}\`;
  }

  // Gerar URL assinada para download
  static async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  // Gerar URL assinada para upload
  static async getSignedUploadUrl(
    fileName: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; key: string }> {
    const key = \`attachments/\${Date.now()}-\${fileName}\`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return { url, key };
  }

  // Deletar arquivo
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  // Extrair key da URL
  static extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(-2).join('/'); // attachments/filename
  }

  // Testar conexão
  static async testConnection(): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: 'test/connection-test.txt',
        Body: 'Test connection',
        ContentType: 'text/plain',
      });

      await s3Client.send(command);
      
      // Deletar arquivo de teste
      await this.deleteFile('test/connection-test.txt');
      
      return true;
    } catch (error) {
      console.error('Erro na conexão com MinIO:', error);
      return false;
    }
  }
}
`;

    fs.writeFileSync(clientPath, clientContent);
    console.log('✅ Cliente MinIO criado em lib/minio-client.ts');
  }

  // Criar script de teste
  createTestScript() {
    const testPath = path.join(this.projectRoot, 'test-minio-connection.js');

    if (fs.existsSync(testPath)) {
      console.log('⚠️  Script de teste já existe');
      return;
    }

    const testContent = `const { S3Client, ListBucketsCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const client = new S3Client({
  endpoint: \`http\${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://\${process.env.MINIO_ENDPOINT}:\${process.env.MINIO_PORT}\`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testMinIOConnection() {
  console.log('🧪 Testando conexão com MinIO...');
  console.log('📍 Endpoint:', \`http\${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://\${process.env.MINIO_ENDPOINT}:\${process.env.MINIO_PORT}\`);
  
  try {
    // Testar listagem de buckets
    console.log('\n1. Testando listagem de buckets...');
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
    console.log('\n2. Testando upload...');
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: 'test/connection-test.txt',
      Body: 'Teste de conexão MinIO - ' + new Date().toISOString(),
      ContentType: 'text/plain',
    });
    
    await client.send(uploadCommand);
    console.log('✅ Upload realizado com sucesso');
    
    // Testar delete
    console.log('\n3. Testando delete...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: 'test/connection-test.txt',
    });
    
    await client.send(deleteCommand);
    console.log('✅ Delete realizado com sucesso');
    
    console.log('\n🎉 Todos os testes passaram! MinIO está funcionando corretamente.');
    console.log('🌐 Console Web: http://localhost:9001');
    console.log('🔑 Usuário: minioadmin');
    console.log('🔑 Senha: minioadmin123');
    
  } catch (error) {
    console.error('❌ Erro na conexão com MinIO:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se MinIO está rodando: docker-compose -f docker-compose.minio.yml ps');
    console.log('2. Iniciar MinIO: docker-compose -f docker-compose.minio.yml up -d');
    console.log('3. Verificar logs: docker-compose -f docker-compose.minio.yml logs');
    console.log('4. Verificar variáveis de ambiente no .env.local');
  }
}

testMinIOConnection();
`;

    fs.writeFileSync(testPath, testContent);
    console.log('✅ Script de teste criado: test-minio-connection.js');
  }

  // Iniciar MinIO com Docker
  startMinIO() {
    console.log('🚀 Iniciando MinIO com Docker...');

    try {
      // Parar containers existentes
      try {
        execSync('docker-compose -f docker-compose.minio.yml down', {
          stdio: 'ignore',
        });
      } catch (error) {
        // Ignorar erro se não existir
      }

      // Iniciar MinIO
      execSync('docker-compose -f docker-compose.minio.yml up -d', {
        stdio: 'inherit',
      });

      console.log('✅ MinIO iniciado com sucesso!');
      console.log('⏳ Aguardando configuração inicial...');

      // Aguardar um pouco para o MinIO inicializar
      setTimeout(() => {
        console.log('\n🎉 MinIO está pronto!');
        console.log('🌐 Console Web: http://localhost:9001');
        console.log('🔑 Usuário: minioadmin');
        console.log('🔑 Senha: minioadmin123');
        console.log('\n📝 Para testar a conexão, execute:');
        console.log('   node test-minio-connection.js');
      }, 10000);
    } catch (error) {
      console.error('❌ Erro ao iniciar MinIO:', error.message);
    }
  }

  // Executar configuração completa
  async run() {
    console.log('🔧 Configuração Automatizada do MinIO S3');
    console.log('==========================================\n');

    // Verificações
    if (!this.checkDocker()) return;
    if (!this.checkDependencies()) return;

    console.log('\n📁 Criando arquivos de configuração...');

    // Criar arquivos
    this.createDockerCompose();
    this.updateEnvFile();
    this.createMinIOClient();
    this.createTestScript();

    console.log('\n🚀 Iniciando MinIO...');
    this.startMinIO();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new MinIOSetup();
  setup.run().catch(console.error);
}

module.exports = MinIOSetup;
