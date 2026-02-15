import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { User } from '../../domain/entities/user.js'

export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(userId: UserIdType, _auditContext: AuditContext): Promise<User | null> {
    this.logger.info(`Executing GetUserByIdUseCase for userId: ${userId}`)

    const user = await this.userRepository.findById(userId)

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found`)
      return null
    }

    return user
  }
}
