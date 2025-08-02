import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { minioClient, minioConfig } from './minio-client';

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<string> {
  const key = `attachments/${fileName}`;
  await minioClient.send(
    new PutObjectCommand({
      Bucket: minioConfig.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    }),
  );
  return `${minioConfig.publicUrl}/${minioConfig.bucketName}/${key}`;
}

export function extractKeyFromUrl(url: string): string {
  const { pathname } = new URL(url);
  const [, , ...rest] = pathname.split('/');
  return rest.join('/');
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: minioConfig.bucketName,
    Key: key,
  });
  return getSignedUrl(minioClient, cmd, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  await minioClient.send(
    new DeleteObjectCommand({
      Bucket: minioConfig.bucketName,
      Key: key,
    }),
  );
}

