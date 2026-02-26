import type { z } from 'zod'

import { AuthResponseSchema, LoginSchema, RegisterSchema } from '../schemas/auth.js'
import { UserSchema } from '../schemas/user.js'

export type LoginDTO = z.infer<typeof LoginSchema>
export type RegisterDTO = z.infer<typeof RegisterSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type User = z.infer<typeof UserSchema>
