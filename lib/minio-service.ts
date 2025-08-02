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
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/');
    // Expecting: ['', bucketName, ...keyParts]
    if (parts.length < 3 || !parts[1] || !parts[2]) {
      throw new Error(`Malformed MinIO URL: ${url}`);
    }
    const [, , ...rest] = parts;
    const key = rest.join('/');
    if (!key) {
      throw new Error(`Could not extract key from URL: ${url}`);
    }
    return key;
  } catch (err) {
    // Optionally, you could log the error here
    throw new Error(`Invalid URL provided to extractKeyFromUrl: ${url}. Error: ${(err as Error).message}`);
  }
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

