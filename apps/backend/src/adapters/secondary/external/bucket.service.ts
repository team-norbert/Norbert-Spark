import type { BucketPort } from '../../../application/ports/bucket.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { obscured } from 'obscured'
import { Agent } from 'https'

export class BucketService implements BucketPort {
  private readonly client: S3Client
  private readonly clientPool: S3Client
  private readonly presignClient: S3Client

  constructor(private readonly logger: LoggerPort) {
    // Standard client for server-side operations
    this.client = new S3Client({
      endpoint: EnvConfig.CLOUDFLARE_ENDPOINT,
      credentials: {
        accessKeyId: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_ID) as string,
        secretAccessKey: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_SECRET) as string,
      },
      region: 'auto',
    })

    this.clientPool = new S3Client({
      endpoint: EnvConfig.CLOUDFLARE_ENDPOINT,
      credentials: {
        accessKeyId: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_ID) as string,
        secretAccessKey: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_SECRET) as string,
      },
      region: 'auto',
      requestHandler: {
        httpsAgent: new Agent({ keepAlive: false }),
      },
    })

    // Separate client for presigned URLs with checksum disabled
    this.presignClient = new S3Client({
      endpoint: EnvConfig.CLOUDFLARE_ENDPOINT,
      credentials: {
        accessKeyId: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_ID) as string,
        secretAccessKey: obscured.value(EnvConfig.CLOUDFLARE_ACCESS_SECRET) as string,
      },
      region: 'auto',
      // Disable flexible checksums for presigned URLs
      // This prevents CRC32 checksum from being added to presigned URLs
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })

    // Add middleware to remove checksum algorithm from requests before signing
    this.presignClient.middlewareStack.add(
      (next) => async (args) => {
        // Remove checksum-related properties from the request
        const request = args.request as { query?: Record<string, string> | undefined }
        const query = request.query
        if (query) {
          if ('x-amz-checksum-crc32' in query) {
            delete query['x-amz-checksum-crc32']
          }
          if ('x-amz-sdk-checksum-algorithm' in query) {
            delete query['x-amz-sdk-checksum-algorithm']
          }
        }
        return next(args)
      },
      {
        step: 'build',
        name: 'removeChecksumMiddleware',
        priority: 'high',
      }
    )
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
  async getFileUrl(bucketName: string, fileKey: string): Promise<Uint8Array | undefined> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })

      const response = await this.client.send(command)

      // Transform the stream body to a byte array
      return response.Body?.transformToByteArray()
    } catch (error) {
      this.logger.error('Error fetching file from bucket', error as Error, {
        bucketName,
        fileKey,
      })
      throw error
    }
  }
  getLoadURL(bucketName: string, filePath: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    })

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds })
  }

  async getUploadURL(
    bucketName: string,
    filePath: string,
    expiresInSeconds: number
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    })

    // Generate presigned URL without checksum validation
    return getSignedUrl(this.presignClient, command, {
      expiresIn: expiresInSeconds,
    })
  }
}
