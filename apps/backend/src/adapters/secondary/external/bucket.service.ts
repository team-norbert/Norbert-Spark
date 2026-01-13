import type { BucketPort } from '../../../application/ports/bucket.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { obscured } from 'obscured'

export class BucketService implements BucketPort {
  private readonly client: S3Client

  constructor(private readonly logger: LoggerPort) {
    this.client = new S3Client({
      endpoint: EnvConfig.CLOUDFLARE_ENDPOINT,
      credentials: {
        accessKeyId: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_ID) as string,
        secretAccessKey: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_SECRET) as string,
      },
      region: 'auto',
    })
  }
  bucketExists(bucketName: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  createBucket(bucketName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  uploadFile(bucketName: string, filePath: string, content: Buffer | string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getFileUrl(bucketName: string, filePath: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  getLoadURL(bucketName: string, filePath: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    })

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds })
  }

  getUploadURL(bucketName: string, filePath: string, expiresInSeconds: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: 'application/octet-stream',
    })

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds })
  }
}
