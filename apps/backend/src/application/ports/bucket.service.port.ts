export interface BucketPort {
  bucketExists(bucketName: string): Promise<boolean>
  createBucket(bucketName: string): Promise<void>
  uploadFile(bucketName: string, filePath: string, content: Buffer | string): Promise<void>
  getFileUrl(bucketName: string, fileKey: string): Promise<Uint8Array | undefined>
  getLoadURL(bucketName: string, filePath: string, expiresInSeconds: number): Promise<string>
  getUploadURL(bucketName: string, filePath: string, expiresInSeconds: number): Promise<string>
}
