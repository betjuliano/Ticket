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
