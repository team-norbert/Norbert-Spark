import multer from 'multer'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files.
 * It is written on top of busboy for maximum efficiency
 * Documentation: https://www.npmjs.com/package/multer
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const uploadsDir = join(__dirname, '..', '..', '..', 'uploads')

export const upload = multer({ dest: uploadsDir })
