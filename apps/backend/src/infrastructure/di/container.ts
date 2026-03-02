import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

// Primary Controllers
import { AIController } from '../../adapters/primary/http/ai.controller.js'
import { AIExtractDataController } from '../../adapters/primary/http/ai.extract-data.js'
import { AiRagController } from '../../adapters/primary/http/ai.rag.controller.js'
import { AIAdminController } from '../../adapters/primary/http/ai-admin.controller.js'
import { AuthController } from '../../adapters/primary/http/auth.controller.js'
import { CompanyController } from '../../adapters/primary/http/company.controller.js'
import { UserController } from '../../adapters/primary/http/user.controller.js'
// Secondary Adapters
import { BucketService } from '../../adapters/secondary/external/bucket.service.js'
// Repositories
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import { AIAdminRepository } from '../../adapters/secondary/repositories/ai-admin.repository.js'
import { AIChatContentRepository } from '../../adapters/secondary/repositories/ai-chat-content.repository.js'
import { AIChatOptionsRepository } from '../../adapters/secondary/repositories/ai-chat-options.repository.js'
import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import { AuditLogRepository } from '../../adapters/secondary/repositories/audit-log.repository.js'
import { CompanyRepository } from '../../adapters/secondary/repositories/company.repository.js'
import { RefreshTokenRepository } from '../../adapters/secondary/repositories/refresh-token.repository.js'
import { UserRepository } from '../../adapters/secondary/repositories/user.repository.js'
// Services
import { ResendService } from '../../adapters/secondary/services/email.service.js'
import { JwtTokenGeneratorService } from '../../adapters/secondary/services/jwt-token-generator.service.js'
import { PinoLoggerService } from '../../adapters/secondary/services/logger.service.js'
// Use Cases
import { AppendedChatUseCase } from '../../application/use-cases/append-chat.use-case.js'
import { DeleteUsersUseCase } from '../../application/use-cases/delete-users.use-case.js'
import { ExtractDataUseCase } from '../../application/use-cases/extract-data.use-case.js'
import { GetAIAdminUseCase } from '../../application/use-cases/get-ai-admin.use-case.js'
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case.js'
import { GetChatUseCase } from '../../application/use-cases/get-chat.use-case.js'
import { GetChatAiOptionsUseCase } from '../../application/use-cases/get-chat-ai-options.use-case.js'
import { GetChatContentByChatIdUseCase } from '../../application/use-cases/get-chat-content-by-chat-id.use-case.js'
import { GetChatDetailsUseCase } from '../../application/use-cases/get-chat-details.use-case.js'
import { GetChatsByUserIdUseCase } from '../../application/use-cases/get-chats-by-userid.use-case.js'
import { GetCompanyDetailsUseCase } from '../../application/use-cases/get-company-details.use-case.js'
import { GetEmbeddingModelUseCase } from '../../application/use-cases/get-embedding-model.use-case.js'
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case.js'
import { LogOutUseCase } from '../../application/use-cases/log-out.use-case.js'
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case.js'
import { PostAIAdminUseCase } from '../../application/use-cases/post-ai-admin.use-case.js'
import { PostChatTypesUseCase } from '../../application/use-cases/post-chat-types.use-case.js'
import { PresignedUploadUrlUseCase } from '../../application/use-cases/presigned-url-put.use-case.js'
import { PutAIAdminUseCase } from '../../application/use-cases/put-ai-admin.use-case.js'
import { PutChatDetailsUseCase } from '../../application/use-cases/put-chat-details.use-case.js'
import { PutCompanyDetailsUseCase } from '../../application/use-cases/put-company-details.use-case.js'
import { RefreshAccessTokenUseCase } from '../../application/use-cases/refresh-access-token.use-case.js'
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js'
import { RegisterUserWithProviderUseCase } from '../../application/use-cases/register-user-with-provider.use-case.js'
import { ResolveChatTypeUseCase } from '../../application/use-cases/resolve-chat-type.use-case.js'
import { SaveChatUseCase } from '../../application/use-cases/save-chat.use-case.js'
// Utils
import { PDFUtils } from '../../shared/utils/pdf.utils.js'
import { EnvConfig } from '../config/env.config.js'
import { pool } from '../database/index.js'
import { createFastifyApp } from '../http/fastify.config.js'

/**
 * Dependency Injection Container implementing the Singleton pattern
 *
 * Manages the application's dependency graph and lifecycle. Initializes all components
 * in the correct order:
 * 1. Infrastructure (logger, Fastify app with optional HTTPS)
 * 2. Services (email, token generation)
 * 3. Repositories (user data access, AI data access)
 * 4. Use cases (application logic)
 * 5. Controllers (HTTP adapters)
 * 6. Route registration
 *
 * The container follows hexagonal architecture with clear separation between
 * primary adapters (controllers), application core (use cases), and secondary
 * adapters (repositories, services).
 *
 * @class Container
 * @example
 * ```typescript
 * const container = Container.getInstance()
 * await container.start()
 * // Application is now running
 * await container.stop()
 * ```
 */
export class Container {
  private static instance: Container

  // Infrastructure
  public readonly app: FastifyInstance

  // Services
  public readonly logger: PinoLoggerService
  public readonly emailService: ResendService
  public readonly tokenGenerator: JwtTokenGeneratorService

  // Repositories
  public readonly userRepository: UserRepository
  public readonly aiRepository: AIRepository
  public readonly bucketService: BucketService
  public readonly aiChatContentRepository: AIChatContentRepository
  public readonly aiAdminRepository: AIAdminRepository
  public readonly aiChatOptionsRepository: AIChatOptionsRepository
  public readonly companyRepository: CompanyRepository
  public readonly aiRagRepository: AIRAGRepository
  public readonly refreshTokenRepo: RefreshTokenRepository

  // Use Cases
  public readonly registerUserUseCase: RegisterUserUseCase
  public readonly getAllUsersUseCase: GetAllUsersUseCase
  public readonly loginUserUseCase: LoginUserUseCase
  public readonly getChatUseCase: GetChatUseCase
  public readonly presignedUploadUrlUseCase: PresignedUploadUrlUseCase
  public readonly extractDataUseCase: ExtractDataUseCase
  private readonly appendChatUseCase: AppendedChatUseCase
  private readonly saveChatUseCase: SaveChatUseCase
  private readonly getChatsByUserIdUseCase: GetChatsByUserIdUseCase
  private readonly getChatContentByChatIdUseCase: GetChatContentByChatIdUseCase
  private readonly registerUserWithProviderUseCase: RegisterUserWithProviderUseCase
  private readonly deleteUsersUseCase: DeleteUsersUseCase
  private readonly getChatDetailsUseCase: GetChatDetailsUseCase
  private readonly getAIAdminUseCase: GetAIAdminUseCase
  private readonly putAIAdminUseCase: PutAIAdminUseCase
  private readonly getChatAiOptionsUseCase: GetChatAiOptionsUseCase
  private readonly resolveChatTypeUseCase: ResolveChatTypeUseCase
  private readonly getCompanyDetailsUseCase: GetCompanyDetailsUseCase
  private readonly putCompanyDetailsUseCase: PutCompanyDetailsUseCase
  private readonly getUserByIdUseCase: GetUserByIdUseCase
  private readonly putChatDetailsUseCase: PutChatDetailsUseCase
  private readonly postChatTypesUseCase: PostChatTypesUseCase
  private readonly postAIAdminUseCase: PostAIAdminUseCase
  private readonly getEmbeddingModelUseCase: GetEmbeddingModelUseCase
  private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase
  private readonly logOutUseCase: LogOutUseCase

  // Utils
  public readonly pdfUtils: PDFUtils

  // Controllers
  public readonly userController: UserController
  public readonly authController: AuthController
  public readonly aiController: AIController
  public readonly aiExtractDataController: AIExtractDataController
  public readonly aiAdminController: AIAdminController
  public readonly companyController: CompanyController
  public readonly aiRagController: AiRagController

  // Audit log
  public readonly auditLog: AuditLogRepository

  /**
   * Private constructor to enforce Singleton pattern
   *
   * Initializes all application components in dependency order:
   * - Validates environment variables
   * - Configures HTTPS for development (optional, falls back to HTTP)
   * - Instantiates logger, services, repositories, use cases, and controllers
   * - Registers all HTTP routes
   *
   * @private
   * @throws {Error} If environment validation fails or Fastify initialization fails
   */
  private constructor() {
    // Validate environment
    EnvConfig.validate()

    // Initialize logger first for structured logging throughout initialization
    this.logger = new PinoLoggerService()

    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      const isDevelopment = EnvConfig.NODE_ENV !== 'production'
      const useHttps = isDevelopment && EnvConfig.USE_HTTPS === 'true'

      let httpsOptions: FastifyServerOptions | undefined
      if (useHttps) {
        // __dirname points to src/infrastructure/di/ directory
        // Go up to backend root, then into certs/
        const certsPath = join(__dirname, '../../..', 'certs')

        try {
          httpsOptions = {
            https: {
              key: readFileSync(join(certsPath, 'key.pem')),
              cert: readFileSync(join(certsPath, 'cert.pem')),
            },
          } as FastifyServerOptions
          this.logger.info('🔒 HTTPS enabled for development')
        } catch {
          const instructions = `To generate certificates with proper Subject Alternative Names:
cd apps/backend/certs && mkcert -key-file key.pem -cert-file cert.pem \\
  localhost \\
  127.0.0.1 \\
  ::1 \\
  *.localhost \\
  local.dev \\
  0.0.0.0`

          this.logger.warn('⚠️  HTTPS certificates not found, falling back to HTTP', {
            certsPath,
            instructions,
          })
        }
      }

      // Initialize infrastructure
      this.app = createFastifyApp(httpsOptions)
    } catch (error) {
      throw new Error(
        `Failed to initialize Fastify app: ${error instanceof Error ? error.message : error}`
      )
    }

    // utils
    this.pdfUtils = new PDFUtils(this.logger)

    // Initialize services (secondary adapters)
    this.emailService = new ResendService(EnvConfig.RESEND_API_KEY, this.logger)
    this.tokenGenerator = new JwtTokenGeneratorService()

    // Initialize repositories (secondary adapters)
    this.userRepository = new UserRepository()
    this.aiRepository = new AIRepository(this.logger)
    this.aiChatContentRepository = new AIChatContentRepository(this.logger)
    this.auditLog = new AuditLogRepository(this.logger)
    this.aiAdminRepository = new AIAdminRepository(this.logger)
    this.aiChatOptionsRepository = new AIChatOptionsRepository(this.logger)
    this.companyRepository = new CompanyRepository(this.logger)
    this.bucketService = new BucketService(this.logger)
    this.aiRagRepository = new AIRAGRepository(this.logger)
    this.refreshTokenRepo = new RefreshTokenRepository(this.logger)
    // Initialize use cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.tokenGenerator,
      this.auditLog
    )
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository, this.logger)
    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.logger,
      this.tokenGenerator,
      this.auditLog,
      this.refreshTokenRepo
    )
    this.getChatUseCase = new GetChatUseCase(this.aiRepository, this.logger, this.auditLog)
    this.appendChatUseCase = new AppendedChatUseCase(this.aiRepository, this.logger, this.auditLog)
    this.saveChatUseCase = new SaveChatUseCase(this.logger, this.aiRepository, this.auditLog)
    this.getChatsByUserIdUseCase = new GetChatsByUserIdUseCase(
      this.aiRepository,
      this.logger,
      this.auditLog
    )
    this.getChatContentByChatIdUseCase = new GetChatContentByChatIdUseCase(
      this.aiRepository,
      this.logger,
      this.auditLog
    )
    this.getChatDetailsUseCase = new GetChatDetailsUseCase(
      this.logger,
      this.auditLog,
      this.aiChatContentRepository
    )
    this.registerUserWithProviderUseCase = new RegisterUserWithProviderUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.tokenGenerator,
      this.auditLog,
      this.refreshTokenRepo
    )
    this.deleteUsersUseCase = new DeleteUsersUseCase(
      this.userRepository,
      this.logger,
      this.auditLog
    )
    this.presignedUploadUrlUseCase = new PresignedUploadUrlUseCase(
      this.logger,
      this.auditLog,
      this.bucketService
    )
    this.extractDataUseCase = new ExtractDataUseCase(this.logger, this.auditLog, this.bucketService)
    this.getAIAdminUseCase = new GetAIAdminUseCase(
      this.logger,
      this.auditLog,
      this.aiAdminRepository
    )
    this.putAIAdminUseCase = new PutAIAdminUseCase(
      this.logger,
      this.auditLog,
      this.aiAdminRepository
    )
    this.getChatAiOptionsUseCase = new GetChatAiOptionsUseCase(
      this.logger,
      this.auditLog,
      this.aiChatOptionsRepository
    )
    this.resolveChatTypeUseCase = new ResolveChatTypeUseCase(
      this.logger,
      this.auditLog,
      this.aiChatContentRepository
    )
    this.getCompanyDetailsUseCase = new GetCompanyDetailsUseCase(
      this.logger,
      this.auditLog,
      this.companyRepository
    )
    this.putCompanyDetailsUseCase = new PutCompanyDetailsUseCase(
      this.logger,
      this.auditLog,
      this.companyRepository
    )
    this.getUserByIdUseCase = new GetUserByIdUseCase(
      this.userRepository,
      this.logger,
      this.auditLog
    )
    this.putChatDetailsUseCase = new PutChatDetailsUseCase(
      this.logger,
      this.auditLog,
      this.aiChatContentRepository
    )
    this.postChatTypesUseCase = new PostChatTypesUseCase(
      this.logger,
      this.auditLog,
      this.aiChatContentRepository
    )
    this.postAIAdminUseCase = new PostAIAdminUseCase(
      this.logger,
      this.auditLog,
      this.aiAdminRepository
    )
    this.getEmbeddingModelUseCase = new GetEmbeddingModelUseCase(
      this.logger,
      this.auditLog,
      this.aiRagRepository
    )
    this.refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(
      this.logger,
      this.auditLog,
      this.refreshTokenRepo,
      this.userRepository,
      this.tokenGenerator
    )
    this.logOutUseCase = new LogOutUseCase(this.logger, this.auditLog, this.refreshTokenRepo)

    // Initialize controllers (primary adapters)
    this.userController = new UserController(
      this.registerUserUseCase,
      this.getAllUsersUseCase,
      this.deleteUsersUseCase,
      this.getUserByIdUseCase,
      this.logger
    )
    this.authController = new AuthController(
      this.logger,
      this.loginUserUseCase,
      this.registerUserWithProviderUseCase,
      this.refreshAccessTokenUseCase
    )
    this.aiController = new AIController(
      this.getChatUseCase,
      this.logger,
      this.appendChatUseCase,
      this.saveChatUseCase,
      this.getChatsByUserIdUseCase,
      this.getChatContentByChatIdUseCase,
      this.getChatDetailsUseCase,
      this.getChatAiOptionsUseCase,
      this.resolveChatTypeUseCase,
      this.putChatDetailsUseCase,
      this.postChatTypesUseCase
    )
    this.aiExtractDataController = new AIExtractDataController(
      this.logger,
      this.presignedUploadUrlUseCase,
      this.extractDataUseCase,
      this.pdfUtils
    )
    this.aiAdminController = new AIAdminController(
      this.logger,
      this.getAIAdminUseCase,
      this.putAIAdminUseCase,
      this.postAIAdminUseCase
    )
    this.companyController = new CompanyController(
      this.logger,
      this.getCompanyDetailsUseCase,
      this.putCompanyDetailsUseCase
    )
    this.aiRagController = new AiRagController(
      this.logger,
      this.getEmbeddingModelUseCase,
      this.presignedUploadUrlUseCase,
      this.pdfUtils
    )
    // Register routes
    this.registerRoutes()
  }

  /**
   * Registers all HTTP routes from controllers with the Fastify app
   *
   * Called automatically during container initialization. Controllers register
   * their respective endpoints with the Fastify instance under the /api/v1 prefix.
   *
   * @private
   */
  private registerRoutes(): void {
    // Register all API routes under /api/v1 prefix
    this.app.register(
      (instance, _opts, done) => {
        this.userController.registerRoutes(instance)
        this.authController.registerRoutes(instance)
        this.aiController.registerRoutes(instance)
        this.aiExtractDataController.registerRoutes(instance)
        this.aiAdminController.registerRoutes(instance)
        this.companyController.registerRoutes(instance)
        this.aiRagController.registerRoutes(instance)
        done()
      },
      { prefix: `/api/${EnvConfig.API_VERSION}` }
    )
  }

  /**
   * Gets the singleton instance of the Container
   *
   * Creates the container on first call and returns the same instance on subsequent calls.
   * This ensures all dependencies are initialized only once.
   *
   * @static
   * @returns {Container} The singleton Container instance
   * @example
   * ```typescript
   * const container = Container.getInstance()
   * const logger = container.logger
   * ```
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  /**
   * Starts the HTTP server
   *
   * Binds the Fastify server to the configured host and port. Uses HTTPS in
   * development if certificates are available, otherwise falls back to HTTP.
   * Logs the server URL and API documentation link.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the server fails to start (exits process with code 1)
   * @example
   * ```typescript
   * const container = Container.getInstance()
   * await container.start()
   * * // Server is now listening on the configured host and port (HTTP or HTTPS)
   * ```
   */
  async start(): Promise<void> {
    try {
      const port = Number.parseInt(EnvConfig.PORT)
      const host = EnvConfig.HOST
      const isDevelopment = EnvConfig.NODE_ENV !== 'production'
      const useHttps = isDevelopment && EnvConfig.USE_HTTPS === 'true'

      await this.app.listen({ port, host })
      const protocol = useHttps ? 'https' : 'http'
      this.logger.info(`Server listening on ${protocol}://${host}:${port}`)
      this.logger.info(`📚 API Documentation: ${protocol}://${host}:${port}/docs`)
    } catch (error) {
      this.logger.error('Failed to start server', error as Error)
      process.exit(1)
    }
  }

  /**
   * Gracefully stops the HTTP server
   *
   * Closes the Fastify server and all active connections. Should be called
   * during application shutdown to ensure clean termination.
   *
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   const container = Container.getInstance()
   *   await container.stop()
   *   process.exit(0)
   * })
   * ```
   */
  async stop(): Promise<void> {
    let hadError = false
    try {
      await this.app.close()
    } catch (error) {
      hadError = true
      this.logger.error('Error while closing server', error as Error)
    } finally {
      try {
        await pool.end()
      } catch (error) {
        hadError = true
        this.logger.error('Error while closing database pool', error as Error)
      }
      if (hadError) {
        this.logger.warn('Server stop completed with errors, see previous logs for details')
      } else {
        this.logger.info('Server stopped')
      }
    }
  }
}
