import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { minioClient, minioConfig } from './minio-client';

export class MinIOService {
  static async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const key = `attachments/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: minioConfig.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await minioClient.send(command);

    // Normalize publicUrl to remove trailing slash
    const normalizedPublicUrl = minioConfig.publicUrl.replace(/\/+$/, '');

    return `${normalizedPublicUrl}/${minioConfig.bucketName}/${key}`;
  }

  static extractKeyFromUrl(url: string): string {
    const prefix = `${minioConfig.publicUrl.replace(/\/$/, '')}/${minioConfig.bucketName}/`;
    if (!url.startsWith(prefix)) {
      throw new Error(`URL does not match expected MinIO prefix: ${prefix}`);
    }
    return url.replace(prefix, '');
  }

  static async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: minioConfig.bucketName,
      Key: key,
    });

    return await getSignedUrl(minioClient, command, { expiresIn });
  }

  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: minioConfig.bucketName,
      Key: key,
    });

    await minioClient.send(command);
  }
}
