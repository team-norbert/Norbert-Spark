import { createHash } from 'crypto'

export function generateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}
