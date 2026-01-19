import type { AIServicePort } from '../ports/ai.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'

export class GetChatOptionsUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort
  ) {}

  public async execute(auditContext: AuditContext): Promise<string[]> {
    // Placeholder implementation - replace with actual logic to fetch chat options
    return ['option1', 'option2', 'option3']
  }
}
