# OpenAPI Specification Structure

This directory contains the split OpenAPI specification for maintainability.

## Directory Structure

```
src/openapi/
├── openapi.json          # Main entry point with $refs to other files
├── paths/                # Individual endpoint definitions
│   ├── health.json
│   ├── users.json
│   ├── users_register.json
│   ├── users_{id}.json
│   ├── auth_login.json
│   ├── auth_oauth-sync.json
│   ├── ai_chat.json
│   ├── ai_chats_{userId}.json
│   ├── ai_fetchChat_{chatId}.json
│   ├── ai_extract-data_presigned-urls.json
│   ├── ai_extract-data_{fileId}.json
│   ├── ai_chats_config.json
│   └── ai_chats_config_{id}_settings.json
└── components/           # Reusable components
    ├── schemas/
    └── securitySchemes/
```

## Workflow

### Making Changes

1. **Edit the split files** in `src/openapi/` (paths or components)
2. **Bundle the changes** to create the single `src/openapi.json`:
   ```bash
   pnpm run bundle:api
   ```
3. **Lint the bundled spec**:
   ```bash
   pnpm run lint:api
   ```

### Adding New Endpoints

1. Edit an existing path file or manually create a new one in `src/openapi/paths/`
2. Add a `$ref` to it in `src/openapi/openapi.json` under `paths:`
3. Run `pnpm run bundle:api` to regenerate the bundled spec

### Regenerating Split Files

If you've edited `src/openapi.json` directly and want to split it again:

```bash
pnpm run split:api
```

## Available Scripts

| Script                   | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `pnpm run bundle:api`    | Bundles split files into `src/openapi.json`          |
| `pnpm run split:api`     | Splits `src/openapi.json` into multiple files        |
| `pnpm run lint:api`      | Bundles and lints the OpenAPI spec with Spectral     |
| `pnpm run docs:api`      | Bundles and serves interactive API docs on port 8080 |
| `pnpm run build:openapi` | Bundles and generates TypeScript types               |

## Benefits of This Approach

✅ **Better maintainability** - Each endpoint in its own file  
✅ **Easier code reviews** - Smaller, focused diffs  
✅ **Team collaboration** - Multiple devs can work on different endpoints  
✅ **Organized by domain** - Related endpoints grouped together  
✅ **Version control friendly** - Clear history per endpoint  
✅ **Tooling compatibility** - Bundles to single file for tools that need it

## Tools Used

- **@redocly/openapi-cli** - For bundling and splitting OpenAPI specs
- **Spectral** - For linting the OpenAPI spec
- **openapi-typescript** - For generating TypeScript types from the spec

## Important Notes

⚠️ The `src/openapi.json` file at the root is **generated** from the split files.  
⚠️ Always edit files in `src/openapi/` directory, not `src/openapi.json`.  
⚠️ Run `pnpm run bundle:api` after making changes to rebuild the bundled spec.  
⚠️ The bundled `src/openapi.json` is committed to git for tooling compatibility.
