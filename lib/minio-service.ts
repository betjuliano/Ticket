import path from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { minioClient, minioConfig } from './minio-client';

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const safeFileName = path.posix
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = path.posix.join('attachments', safeFileName);

  const command = new PutObjectCommand({
    Bucket: minioConfig.bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: metadata,
  });

  await minioClient.send(command);

  const normalizedPublicUrl = minioConfig.publicUrl.replace(/\/+$/, '');

  return `${normalizedPublicUrl}/${minioConfig.bucketName}/${key}`;
}

export function extractKeyFromUrl(url: string): string {
  const expectedHost = new URL(minioConfig.publicUrl).host;
  const { host, pathname } = new URL(url);

  if (host !== expectedHost) {
    throw new Error(`URL does not match expected MinIO host: ${expectedHost}`);
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== minioConfig.bucketName) {
    throw new Error(
      `URL path does not start with bucket name: ${minioConfig.bucketName}`
    );
  }

  return segments.slice(1).join('/');
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: minioConfig.bucketName,
    Key: key,
  });
  return getSignedUrl(minioClient, cmd, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({
    Bucket: minioConfig.bucketName,
    Key: key,
  });
  await minioClient.send(cmd);
}

