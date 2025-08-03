# Configuração MinIO S3 para Sistema de Tickets

## Visão Geral

Este guia mostra como configurar o MinIO S3 como alternativa ao Supabase Storage para gerenciar anexos de tickets.

## 🌐 Configuração com Domínio Personalizado

Se você já tem um MinIO rodando em um domínio personalizado (como `https://minio.iaprojetos.com.br`), você pode pular a instalação local e usar diretamente:

### Variáveis de Ambiente para Domínio Personalizado:

```env
# MinIO S3 Configuration (Domínio Personalizado)
MINIO_ENDPOINT=minio.iaprojetos.com.br
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=seu_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET_NAME=ticket-attachments
MINIO_REGION=us-east-1

# URLs para a aplicação
MINIO_PUBLIC_URL=https://minio.iaprojetos.com.br
MINIO_CONSOLE_URL=https://minio.iaprojetos.com.br/browser
```

### Configuração do Cliente para Domínio Personalizado:

```typescript
// lib/minio-client.ts
import { S3Client } from '@aws-sdk/client-s3';

const minioClient = new S3Client({
  endpoint: `https://${process.env.MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Importante para MinIO
});

export { minioClient };
```

---

## 1. Instalação e Configuração do MinIO

### Opção 1: Docker (Recomendado)

```yaml
# docker-compose.minio.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio-storage
    ports:
      - '9000:9000' # API
      - '9001:9001' # Console Web
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_CONSOLE_ADDRESS: ':9001'
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - ticket-network

  # Cliente MinIO para configuração inicial
  minio-client:
    image: minio/mc:latest
    container_name: minio-client
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 10;
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/ticket-attachments;
      /usr/bin/mc policy set public myminio/ticket-attachments;
      exit 0;
      "
    networks:
      - ticket-network

volumes:
  minio_data:

networks:
  ticket-network:
    driver: bridge
```

### Opção 2: Instalação Local

```bash
# Windows
wget https://dl.min.io/server/minio/release/windows-amd64/minio.exe
./minio.exe server C:\minio-data --console-address ":9001"

# Linux/macOS
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server ./data --console-address ":9001"
```

## 2. Configuração Inicial

### Acessar Console Web

- URL: http://localhost:9001
- Usuário: minioadmin
- Senha: minioadmin123

### Criar Bucket via Console

1. Acesse "Buckets" no menu lateral
2. Clique em "Create Bucket"
3. Nome: `ticket-attachments`
4. Configurar política de acesso público para leitura

### Configuração via MinIO Client (mc)

```bash
# Instalar MinIO Client
wget https://dl.min.io/client/mc/release/windows-amd64/mc.exe

# Configurar alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin123

# Criar bucket
mc mb myminio/ticket-attachments

# Configurar política pública para leitura
mc policy set download myminio/ticket-attachments

# Verificar configuração
mc ls myminio
```

## 3. Configuração da Aplicação

### Variáveis de Ambiente (.env.local)

```env
# MinIO S3 Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=ticket-attachments
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# URL pública para acesso aos arquivos
MINIO_PUBLIC_URL=http://localhost:9000
```

### Instalação de Dependências

```bash
npm install aws-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 4. Implementação do Cliente S3

### lib/minio-client.ts

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
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
    const key = `attachments/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);

    // Retorna URL pública
    return `${process.env.MINIO_PUBLIC_URL}/${BUCKET_NAME}/${key}`;
  }

  // Gerar URL assinada para download
  static async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
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
    const key = `attachments/${Date.now()}-${fileName}`;

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
}
```

## 5. API Routes para Upload

### app/api/attachments/upload/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MinIOService } from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !ticketId || !userId) {
      return NextResponse.json(
        { error: 'Arquivo, ticketId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validações
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload para MinIO
    const fileUrl = await MinIOService.uploadFile(
      buffer,
      file.name,
      file.type,
      {
        ticketId,
        userId,
        originalName: file.name,
      }
    );

    // Salvar no banco de dados
    const attachment = await prisma.attachment.create({
      data: {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: fileUrl,
        ticketId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### app/api/attachments/[id]/download/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MinIOService } from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Extrair key da URL
    const key = MinIOService.extractKeyFromUrl(attachment.url);

    // Gerar URL assinada para download
    const signedUrl = await MinIOService.getSignedDownloadUrl(key);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Erro no download:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

## 6. Componente de Upload

### components/forms/file-upload.tsx

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FileUploadProps {
  ticketId: string;
  userId: string;
  onUploadComplete?: (attachment: any) => void;
}

export function FileUpload({ ticketId, userId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      formData.append('userId', userId);

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Arquivo enviado com sucesso!');
        onUploadComplete?.(result.attachment);
      } else {
        toast.error(result.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro no upload do arquivo');
    } finally {
      setUploading(false);
      // Limpar input
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
      />
      {uploading && (
        <span className="text-sm text-muted-foreground">Enviando...</span>
      )}
    </div>
  );
}
```

## 7. Migração dos Scripts SQL

### Atualizar supabase-storage-setup.sql

```sql
-- ========================================
-- CONFIGURAÇÃO DE STORAGE ALTERNATIVO (MinIO S3)
-- Sistema de Tickets - Gerenciamento de Anexos
-- ========================================

-- Nota: Este script é para referência quando usando MinIO S3
-- As configurações de storage são feitas via MinIO Console ou API

-- Função para validar URLs de anexos
CREATE OR REPLACE FUNCTION validate_attachment_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar se a URL é do MinIO configurado
    RETURN url LIKE 'http%://localhost:9000/ticket-attachments/%'
        OR url LIKE 'http%://' || current_setting('app.minio_host', true) || '%/ticket-attachments/%';
END;
$$ LANGUAGE plpgsql;

-- Função para extrair key do MinIO da URL
CREATE OR REPLACE FUNCTION extract_minio_key(url TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Extrair a parte da key da URL do MinIO
    RETURN regexp_replace(url, '^.*/ticket-attachments/', 'attachments/');
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar URLs de anexos
CREATE OR REPLACE FUNCTION validate_attachment_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_attachment_url(NEW.url) THEN
        RAISE EXCEPTION 'URL de anexo inválida: %', NEW.url;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_attachment_url
    BEFORE INSERT OR UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION validate_attachment_before_insert();

COMMIT;
```

## 8. Configuração de Produção

### Docker Compose para Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio-prod
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_CONSOLE_ADDRESS: ':9001'
    volumes:
      - /data/minio:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: nginx-minio
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - minio
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    external: true
```

### Configuração Nginx

```nginx
# nginx.conf
server {
    listen 80;
    server_name storage.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name storage.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # MinIO API
    location / {
        proxy_pass http://minio:9000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 50M;
    }
}

server {
    listen 443 ssl http2;
    server_name console.storage.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # MinIO Console
    location / {
        proxy_pass http://minio:9001;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 9. Monitoramento e Backup

### Script de Backup

```bash
#!/bin/bash
# backup-minio.sh

BACKUP_DIR="/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
BUCKET_NAME="ticket-attachments"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup usando MinIO Client
mc mirror myminio/$BUCKET_NAME $BACKUP_DIR/$DATE/

# Compactar backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE/

# Remover diretório temporário
rm -rf $BACKUP_DIR/$DATE/

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup concluído: backup_$DATE.tar.gz"
```

## 10. Testes

### Teste de Conectividade

```javascript
// test-minio.js
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin123',
  },
  forcePathStyle: true,
});

async function testConnection() {
  try {
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    console.log('✅ Conexão com MinIO bem-sucedida!');
    console.log(
      'Buckets:',
      response.Buckets?.map(b => b.Name)
    );
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  }
}

testConnection();
```

## Próximos Passos

1. **Configurar MinIO**: Execute o docker-compose ou instale localmente
2. **Criar bucket**: Configure o bucket `ticket-attachments`
3. **Atualizar .env.local**: Adicione as variáveis do MinIO
4. **Instalar dependências**: `npm install aws-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
5. **Implementar cliente**: Adicione o arquivo `lib/minio-client.ts`
6. **Atualizar APIs**: Modifique as rotas de upload/download
7. **Testar**: Execute o script de teste de conectividade
8. **Deploy**: Configure para produção com SSL/TLS

## Vantagens do MinIO S3

- ✅ **Compatível com S3**: API totalmente compatível
- ✅ **Self-hosted**: Controle total dos dados
- ✅ **Performance**: Alta performance para uploads/downloads
- ✅ **Escalável**: Pode ser configurado em cluster
- ✅ **Interface Web**: Console administrativo intuitivo
- ✅ **Backup**: Ferramentas nativas de backup e replicação
- ✅ **Segurança**: Controle de acesso granular
- ✅ **Custo**: Sem custos de armazenamento em nuvem
