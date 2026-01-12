import type { ExternalCloudflareServicePort } from '../../../application/ports/external-cloudflare.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import Cloudflare from 'cloudflare'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { obscured } from 'obscured'

export class ExternalCloudflareService implements ExternalCloudflareServicePort {
  private readonly client: Cloudflare

  constructor(private readonly logger: LoggerPort) {
    this.client = new Cloudflare({
      apiToken: obscured.value(EnvConfig.CLOUDFLARE_API), // This is the default and can be omitted
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
