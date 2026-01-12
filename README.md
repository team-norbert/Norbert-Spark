# Norbert's Spark - an AI tools CRM

Norbert's Spark ( named after Norbert Wiener, the father of cybernetics) is a cutting-edge AI tools CRM designed to help users manage and leverage AI technologies effectively. Built with modern web technologies, it offers a seamless experience for integrating AI capabilities into everyday workflows.

Although there already exist various AI-SDK starter kits, such as the [Next.js Open API Starter Kit](https://ai-sdk.dev/cookbook), Norbert's Spark. goes a step further by providing a comprehensive monorepo structure that includes both frontend and backend components, along with a PostgreSQL database setup.

The aim of Norbert's Spark is to avoid tight coupling between any one technology. On the roadmap are there three different ways to deploy Norbert's Spark: the first is to use PaaS services such as Vercel and Supabase; the second is to use container orchestration platforms like Docker; and the third is to deploy to AWS using either Terraform or Pulumi.

The other difference between Norbert's Spark and other AI-SDK starter kits is that the backend is where the busines logic resides, with the frontend being a thin client. This is in contrast to many AI-SDK starter kits where the frontend contains most of the business logic and directly calls the AI provider APIs. In Norbert's Spark, the frontend calls the backend API, which in turn calls the AI provider APIs. This architecture enhances security, maintainability, and scalability.

In this repo is a frontend that uses Next.js 16 with React 19 and Material UI. The purpose of this frontend is to provide a user interface for interacting with the AI tools CRM. In the frontend, users can manage their AI tools, view analytics, and configure settings.

In the packages/shared is the OpenAPI spec: packages/shared/src/openapi.json. This is used in the frontend but it is intended that the user accesses the OpenAPI spec to build out their own frontend UI.

## Table of Contents

- [Architecture](#architecture)

The architecture in both the backend and frontend follows the principles of Clean Architecture, ensuring a clear separation of concerns and maintainability. The layers are organized as follows: - **Domain Layer**: Contains the core business logic and entities. - **Application Layer**: Manages use cases and application-specific logic. - **Infrastructure Layer**: Handles data access, external APIs, and other infrastructure concerns. - **View Layer** (Frontend only): Manages UI components and user interactions.

The pattern promotes testability, scalability, and ease of understanding, making it easier to adapt to changing requirements over time. The architecture follows the Hexagonal Architecture (Ports and Adapters) principles, allowing for flexibility in integrating different technologies and services. It also aligns with Domain-Driven Design (DDD) concepts, focusing on the core domain and its complexities.

For ease of working with AI tools, there are three parts to the codebase:

- The architecture is written in text fields throughout the codebase. As an example, the hexagonal architecture is explained in the root of the backend in this document: apps/backend/src/HEXAGONAL_ARCHITECTURE.txt. These descriptions are optimized for consumption by AI agents, making it easier for them to understand and navigate the system architecture.
- There are extensive JSDocs comments. Previously code comments were considered bad practice due to the drift between code and comments. However, with the advent of AI tools like GPT-4, well-written comments can be invaluable for understanding code. AI models can use these comments to generate explanations, documentation, and even assist in code generation. Therefore, the codebase includes comprehensive JSDocs comments to facilitate better understanding and collaboration.
- There is a highly opinionated code quality pipeline including ESLint, Prettier, and TypeScript configurations to ensure consistent code style and quality across the project.
- There is a strong emphasis on testing, with unit tests using Vitest and end-to-end tests using Playwright to ensure the reliability and stability of the application.
- Eval testing is a key part of the development process: apps/backend/evals. Eval testing provides a means to validate the functionality and performance of AI models integrated into the application. By running eval tests, developers and business owners can assess how well the AI models perform in real-world scenarios, identify potential issues, and make necessary improvements. This ensures that the AI components meet the desired quality standards and deliver accurate results to users.

- [Tech Stack](#tech-stack)

The tech stack choices are listed as below.

### Husky

There are two husky hooks configured:

- `pre-commit`: Runs `pnpm lint:staged` to lint only the staged files before committing. This ensures that only code that passes linting is committed to the repository.
- `pre-push`: Runs `pnpm test` to execute the test suite before pushing changes to the remote repository. This helps catch any failing tests before code is pushed, maintaining code quality

These hooks help enforce code quality standards and prevent potential issues from being introduced into the codebase.

Using husky hooks are particularly important today as not just a means of helping developers maintain code quality, but also as a way to ensure that AI-generated code adheres to the project's standards. As AI tools become more prevalent in code generation, husky hooks can serve as a safeguard to catch any issues or inconsistencies introduced by AI-generated code before it is committed or pushed to the repository.

### Conventional Commits

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Minimum required format:**

```
<type>: <subject>
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

## Examples

### Simple commits

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation bug"
git commit -m "docs: update README with setup instructions"
```

### With scope

```bash
git commit -m "feat(auth): add login functionality"
git commit -m "fix(api): handle null responses"
git commit -m "test(components): add unit tests for Button"
```

### With breaking changes

```bash
git commit -m "feat(api): change response format

BREAKING CHANGE: API responses now return data in camelCase instead of snake_case"
```

## Enforcement

Commit messages are validated using `commitlint` via a Husky `commit-msg` hook. Invalid commits will be rejected with an error message explaining what's wrong.

## Tips

- Keep the subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- Don't capitalize the first letter of the subject
- Don't end the subject line with a period

### Code Quality intialisers

This project uses both [ts-reset](https://www.totaltypescript.com/ts-reset) and [modern-normalize](https://www.npmjs.com/package/modern-normalize) to improve code quality and ensure consistency across different environments, for TypeScript and CSS respectively.

### ESLint and Prettier

#### The choice of ESlint plugins is as follows:

##### @eslint/js

Core ESLint JavaScript rules providing foundational linting for JavaScript code. Uses the recommended configuration as the base for all ESLint setups.

##### @typescript-eslint/eslint-plugin

TypeScript-specific linting rules that understand TypeScript syntax and semantics. Provides rules for type checking, async best practices, and TypeScript idioms. Used across all workspaces.

**Rules**:

- `@typescript-eslint/no-unused-vars`: Warn - Allows unused variables prefixed with `_`
- `@typescript-eslint/triple-slash-reference`: Off (frontend only) - Allows triple-slash references for Next.js types

##### @typescript-eslint/parser

Parser that allows ESLint to understand TypeScript syntax. Required for all TypeScript linting rules to function properly.

##### eslint-plugin-codegen

Manages code generation tasks and ensures generated code follows project conventions. Used in root configuration.

##### eslint-plugin-import

Manages import/export syntax and prevents issues like duplicate imports, missing imports, and incorrect import ordering.

**Rules**:

- `import/first`: Error - Ensures imports come first
- `import/newline-after-import`: Error - Enforces blank line after imports
- `import/no-duplicates`: Error - Prevents duplicate imports

##### eslint-plugin-simple-import-sort

Automatically sorts import statements in a consistent order. Enforces alphabetical ordering of imports and exports.

**Rules**:

- `simple-import-sort/imports`: Error - Enforces sorted imports
- `simple-import-sort/exports`: Error - Enforces sorted exports

Used in: Root, Shared package

##### eslint-plugin-sort-destructure-keys

Sorts destructured object keys alphabetically for consistency.

**Rules**:

- `sort-destructure-keys/sort-destructure-keys`: Warn - Suggests sorting destructured keys

Used in: Root, Shared package

##### eslint-plugin-jsdoc

Enforces proper JSDoc comment format and completeness. Ensures documentation is clear and consistent.

**Rules**:

- `jsdoc/check-alignment`: Warn - Checks JSDoc alignment
- `jsdoc/check-param-names`: Warn - Validates parameter names
- `jsdoc/check-tag-names`: Warn - Ensures valid JSDoc tags
- `jsdoc/check-types`: Warn - Validates type annotations
- `jsdoc/require-param-description`: Warn - Requires parameter descriptions
- `jsdoc/require-returns-description`: Warn - Requires return descriptions

Used in: Root, Frontend

##### eslint-plugin-security

Identifies potential security vulnerabilities in the code including unsafe regular expressions, eval usage, and timing attacks.

**Rules**:

- `security/detect-object-injection`: Warn - Detects potential object injection vulnerabilities
- `security/detect-non-literal-regexp`: Warn - Warns about non-literal RegExp constructors
- `security/detect-unsafe-regex`: Error - Detects regex vulnerabilities
- `security/detect-buffer-noassert`: Error - Prevents buffer vulnerabilities
- `security/detect-eval-with-expression`: Error - Prevents eval usage
- `security/detect-no-csrf-before-method-override`: Error - CSRF protection
- `security/detect-possible-timing-attacks`: Warn - Detects timing attack vulnerabilities

Used in: Root, Frontend

##### @vitest/eslint-plugin

Provides linting rules for Vitest test files. Enforces best practices for test writing, proper test structure, avoiding duplicate test names, and ensuring proper assertions.

**Configuration**: Applied to `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx` files

**Rules**:

- Uses recommended Vitest rules
- `vitest/no-conditional-expect`: Off (shared package) - Allows conditional expects for type narrowing

Used in: Backend, Frontend, Shared package

##### @next/eslint-plugin-next

Next.js-specific linting rules that catch common mistakes and enforce best practices for Next.js applications.

**Rules**:

- `@next/next/no-html-link-for-pages`: Error - Use Next.js `<Link>` component instead of `<a>` tags
- `@next/next/no-img-element`: Warn - Use Next.js `<Image>` component for optimized images
- `@next/next/no-sync-scripts`: Error - Prevents synchronous scripts that block rendering
- `@next/next/no-duplicate-head`: Error - Avoids duplicate `<Head>` components

Used in: Frontend only

##### @tanstack/eslint-plugin-query

React Query (TanStack Query) specific rules for proper query usage and cache management. Ensures best practices with React Query hooks.

**Configuration**: Uses `flat/recommended` preset

Used in: Frontend only

##### eslint-plugin-react

Core React linting rules for JSX syntax, component patterns, and React best practices.

**Configuration**:

- Uses `flat.recommended` preset
- Uses `flat.jsx-runtime` preset (no need to import React in JSX files)

Used in: Frontend only

##### eslint-plugin-react-hooks

Enforces the Rules of Hooks and proper dependency arrays in React hooks. Catches common mistakes with hooks like `useEffect`, `useCallback`, `useMemo`, etc.

**Configuration**: Uses recommended rules

Used in: Frontend only

##### eslint-plugin-jsx-a11y

Accessibility (a11y) rules for JSX elements. Catches accessibility violations like missing alt text, improper ARIA attributes, and keyboard navigation issues.

**Configuration**: Uses `flatConfigs.recommended` for comprehensive accessibility checking

Used in: Frontend only

##### eslint-plugin-drizzle

Drizzle ORM-specific rules to prevent unsafe database operations.

**Applied to**: `src/db/**/*.{ts,tsx}` files only

**Rules**:

- `drizzle/enforce-delete-with-where`: Error - Requires WHERE clause in DELETE statements to prevent accidental mass deletions
- `drizzle/enforce-update-with-where`: Error - Requires WHERE clause in UPDATE statements to prevent accidental mass updates

Used in: Frontend only

##### eslint-plugin-playwright

Playwright-specific rules for E2E test files. Enforces best practices for Playwright tests.

**Applied to**: `e2e/**/*.{ts,js}` files only

**Configuration**: Uses `flat/recommended` preset

Used in: Frontend only

##### typescript-eslint (package)

Unified TypeScript ESLint tooling package that provides both the plugin and parser. Used for TypeScript-specific configurations.

**Configuration**: Uses recommended preset from `typescript-eslint` package

Used in: Frontend only

#### Common Custom Rules Across Workspaces

- `no-console`: Varies by workspace - Warn in root (with exceptions), warn in shared, off in backend, off in frontend
- `no-restricted-syntax`: Error - Disallows TypeScript enums across all workspaces, enforcing const objects with "as const" instead for better type safety and runtime behavior
- `no-unused-vars`: Off - Disabled in favor of TypeScript-specific rule
- `semi`: Error - Never use semicolons (root config only)

### Prettier

Prettier is configured to ensure consistent code formatting across the entire codebase. The configuration is defined in the `.prettierrc` file at the root of the monorepo. Key Prettier settings include:

- **Print Width**: 100 characters - Keeps lines reasonably short for better readability
- **Tab Width**: 2 spaces - Standard indentation size for JavaScript/TypeScript
- **Use Tabs**: false - Uses spaces for indentation instead of tabs
- **Semi**: false - Omits semicolons at the end of statements
- **Single Quote**: true - Uses single quotes for strings instead of double quotes
- **Trailing Comma**: "all" - Adds trailing commas where valid in ES5

Run prettier in the root of the project with:

```bash
pnpm run format
```

The `--cache` option is used to speed up formatting by only processing changed files.'

### Tubrorepo and PNPM

Turborepo is used as the build system and task runner for this monorepo.
It provides efficient caching, parallel execution, and dependency graph management to optimize build times and developer productivity. Turborepo allows defining tasks in each package's `package.json` and orchestrates their execution based on dependencies.

PNPM is used as the package manager for this monorepo.
PNPM provides fast and efficient package management with a unique disk space-saving approach using symlinks.
It ensures consistent dependency resolution across all packages in the monorepo and integrates seamlessly with Turborepo for managing dependencies and scripts.

### Drizzle ORM and PostgreSQL

This apps use PostgreSQL 18.1 as the database, managed via Docker Compose for easy setup and deployment.
Drizzle ORM is used as the database ORM, providing a type-safe and modern way to interact with the PostgreSQL database using TypeScript.

The use of both PostgreSQL and Drizzle is as follows:

- SQL migration = source of truth

- Drizzle schema = typed access layer

This avoids ORM drift and keeps invariants enforceable even if someone bypasses the app.

### Mermaid

Mermaid is used in the backend for generating diagrams and visualizations from text-based descriptions. It allows developers to create flowcharts, sequence diagrams, class diagrams, and more using a simple markdown-like syntax. Mermaid is integrated into the backend to help visualize architecture, workflows, and other concepts directly from code comments or markdown files.

For example, the dependency injection container diagram is generated using Mermaid syntax in `apps/backend/src/infrastructure/di/container.md`. You can render this diagram by the following command:

```bash
cd apps/backend
pnpm mermaid src/infrastructure/di/container.md
```

### [Sentry](https://sentry.io/)

Sentry is integrated into both the frontend and backend applications for error tracking and performance monitoring. It provides real-time insights into application errors, crashes, and performance bottlenecks, allowing developers to quickly identify and resolve issues.
It also now supports monitoring AI interactions, helping to track and analyze the performance of AI models integrated into the applications.
Sentry will:

- Track token usage, costs, and latency across all your LLM calls
- Monitor agent conversations, tool usage, and decision-making processes
- Debug failed requests and optimize prompt performance with detailed traces

In the environment variables you will need to set `SENTRY_ACCOUNT` as true or false.
If true, you will also need to set `SENTRY_DSN`.

Using Sentry with AI-SDK requires the use of telemetry integration provided by AI-SDK.
This integration captures detailed telemetry data from AI interactions, including token usage, response times, and error rates. By leveraging this telemetry data, Sentry can provide deeper insights into the performance and reliability of AI models within your applications.
More details can be found in the [AI-SDK documentation](https://ai-sdk.dev/docs/ai-sdk-core/telemetry).
This app is already configured to use both Telemetry and Sentry.
If you want to use this service, is create a Sentry account and set the environment variables as described above.
In the Sentry configuration (apps/backend/src/infrastructure/security/instrument.ts), I have set the sendDefaultPii property to false. Setting sendDefaultPii to true sends personally identifiable information to Sentry unconditionally. This should be configurable via environment variable or set to false by default, especially to comply with privacy regulations like GDPR.
If you want to use this service, the first step is to create a Sentry account and set the environment variables as described above.
In the configuration, you can adjust the `tracesSampleRate` based on the environment.
I've set it to 0.1 for production and 1.0 for development to balance performance monitoring with overhead.
```typescript
tracesSampleRate: EnvConfig.NODE_ENV === 'production'?  0.1 : 1.0
````


### GitHub Actions

The project includes two automated GitHub Actions workflows to maintain code quality and dependency management:

**1. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)**

- **Triggers**: Runs on pull requests and pushes to the `main` branch
- **Purpose**: Ensures code quality and compatibility across Node.js versions
- **Matrix Testing**: Tests against Node.js 22.x and 24.x
- **Steps**:
  - Format checking (Prettier)
  - Linting (ESLint)
  - Unit tests (Vitest)
  - Production build verification
- **Benefits**: Catches issues early before merging to main

**2. Update Dependencies (`.github/workflows/update-dependencies.yml`)**

- **Triggers**: Runs daily at 9:00 AM UTC (configurable via cron) or manually via workflow_dispatch
- **Purpose**: Automatically updates minor and patch dependencies to keep the project secure and up-to-date
- **Steps**:
  - Updates dependencies in root, frontend, and backend workspaces using `pnpm update`
  - Runs tests, type checking, and linting to detect breaking changes
  - Creates a pull request with the updates if changes are detected
  - PR title indicates if tests fail (⚠️ TESTS FAILING) for immediate attention
- **Benefits**: Reduces manual dependency maintenance, ensures security patches are applied promptly, and provides visibility into potential breaking changes

Both workflows use PNPM for consistent package management and leverage caching to improve execution speed.

- [Prerequisites](#prerequisites)

### How to create an API endpoint

This app follows an API-First development workflow. This means that the API specification is written first and is the the single source of truth for the API. The API specification is written in the OpenAPI format and is located in `packages/shared/src/openapi.json`.

Firstly, create an endpoint specification in the OpenAPI format and add it to `packages/shared/src/openapi.json`.

In this example I've added a delete operation to an exising endpoint. After your change, the OpenAPI spec should include a `delete` operation on the chosen path with an appropriate `operationId`.

In the shared package run 'pnpm run lint:api'. It uses Spectral to validate the OpenAPI spec.

Then run 'pnpm run build' in the shared package to generate types from the OpenAPI spec. These types are available to use in both the frontend and backend packages.

Then run 'pnpm run build' in the shared package to generate types from the OpenAPI spec. These types are available to use in both the frontend and backend packages.

In 'apps/backend/src/adapters/primary/http' find the correct controller to add the new operation to.

For this example, I've added a delete operation to 'apps/backend/src/adapters/primary/http/controllers/customers.controller.ts'. The controller now includes a handler method for the `delete` operation that matches the `operationId` defined in the OpenAPI spec.
The operationId in the OpenAPI spec should be the same as the method name in the controller.

You can create a Data Transfer Objects in 'apps/backend/src/application/dtos' for runtime validation if needed, or you can use Drizzle schemas directly.

Then implement the use case in 'apps/backend/src/application/use-cases'.

There may already be a use case that matches the operation you are implementing, in which case you can just call that use case from the controller.

Or you can create a new use case.

In the 'apps/backend/src/adapters/secondary/repositories' repository is where database queries should be implemented.

In this case I created a new deleteUsers method for the PostgresUserRepository.
** example **

Also, add this method to the relevant port interface in 'apps/backend/src/application/ports':
** example **

The dependency injection container is in 'apps/backend/src/infrastructure/di/container.ts'. Here, bind the new repository method to the use case.

Finally, implement the database logic in 'apps/backend/src/infrastructure/db'.

- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Frontend Development](#frontend-development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Architecture

This project is a monorepo with the following structure:

- **frontend**: Next.js framework with React 19 and Material UI
- **backend**: Fastify TypeScript API server
- **PostgreSQL**: Docker-based PostgreSQL 18.1 database

## Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **UI Library**: [Material UI 7](https://mui.com/) with Emotion
- **AI Integration**: [@ai-sdk/google](https://www.npmjs.com/package/@ai-sdk/google) and [ai](https://www.npmjs.com/package/ai)
- **Database ORM**: [Drizzle](https://orm.drizzle.team/)
- **Code Quality**: ESLint, Prettier
- **Testing**:
  - Unit Tests: [Vitest](https://vitest.dev/)
  - E2E Tests: [Playwright](https://playwright.dev/)

### Monorepo Tools

- **Package Manager**: [PNPM](https://pnpm.io/)
- **Build System**: [Turborepo](https://turbo.build/)

### Database

- **PostgreSQL 18.1**: Docker-based PostgreSQL instance

## Prerequisites

- Node.js >= 18
- PNPM >= 8
- Docker and Docker Compose (for PostgreSQL)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

Update the values in `.env` with your configuration.

### 3. Start PostgreSQL

Start the PostgreSQL database:

```bash
cd backend
docker compose up -d
```

See `DOCKER_POSTGRES.md` for detailed database setup instructions.

### 4. Development

Run all workspaces in development mode:

```bash
pnpm dev
```

Or run individual workspaces:

```bash
# Frontend only
cd frontend && pnpm dev

# Backend only
cd backend && pnpm dev
```

### 5. Build

Build all workspaces:

```bash
pnpm build
```

## Available Scripts

- `pnpm dev` - Start development servers for all workspaces
- `pnpm build` - Build all workspaces
- `pnpm lint` - Run linting across all workspaces
- `pnpm test` - Run tests across all workspaces
- `pnpm format` - Format code with Prettier

## Frontend Development

The frontend is built with Next.js and React 19. Key features:

- **App Router**: Next.js 16's powerful routing system
- **Server & Client Components**: Optimal performance with RSC
- **Material UI**: Pre-built UI components with dark theme
- **AI Integration**: Ready for AI-powered features
- **Database**: Drizzle ORM for type-safe database queries

### Running Tests

```bash
cd frontend

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## Project Structure

```
norberts-spark/
├── frontend/           # Next.js + React frontend
│   ├── src/
│   │   ├── app/       # Next.js App Router
│   │   ├── view/      # View layer (components, hooks)
│   │   ├── domain/    # Domain layer (entities, schemas)
│   │   ├── application/ # Application layer (use cases)
│   │   ├── infrastructure/ # Infrastructure layer (DB, API)
│   │   └── test/      # Test utilities
│   ├── e2e/           # Playwright E2E tests
│   └── public/        # Static assets
├── backend/           # Fastify TypeScript API
│   ├── src/
│   ├── docker-compose.yml  # PostgreSQL Docker configuration
│   ├── init-scripts/       # PostgreSQL initialization scripts
│   └── .env.example        # Environment variables template
├── turbo.json         # Turborepo configuration
├── pnpm-workspace.yaml# PNPM workspace configuration
└── package.json       # Root package.json
```

## Contributing

1. Create a new branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

### AGPLv3

This project is licensed under the [Affero General Public License v3.0 (AGPLv3)](https://www.gnu.org/licenses/agpl-3.0.en.html). By using, modifying, or distributing this software, you agree to comply with the terms of the AGPLv3 license.

The AGPLv3 is a copyleft license that requires anyone who distributes the software, or a derivative work, to make the source code available under the same license. This includes providing access to the source code of any modifications made to the original software.

For more details, see the [LICENSE](./LICENSE) file.
