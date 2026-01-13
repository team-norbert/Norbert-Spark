export interface BucketPort {
  bucketExists(bucketName: string): Promise<boolean>
  createBucket(bucketName: string): Promise<void>
  uploadFile(bucketName: string, filePath: string, content: Buffer | string): Promise<void>
  getFileUrl(bucketName: string, filePath: string): Promise<string>
}
