import type { BucketPort } from '../../../application/ports/bucket.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import AWS from 'aws-sdk'
import type { S3 as s3 } from 'aws-sdk'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { obscured } from 'obscured'

export class BucketService implements BucketPort {
  private readonly client: s3
  private secretAccessKey: any

  constructor(private readonly logger: LoggerPort) {
    this.client = new AWS.S3({
      endpoint: EnvConfig.CLOUDFLARE_ENDPOINT,
      credentials: {
        accessKeyId: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_ID) as string,
        secretAccessKey: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_SECRET) as string,
      },
      region: 'auto',
      signatureVersion: 'v4',
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
}
