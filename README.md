# Inventory Order Processing API

Fastify service that processes orders using a strategy of product-type handlers (normal, expirable, seasonal) orchestrated by an `OrderProcessor`. Dependencies are managed with Awilix and data is stored in SQLite via Drizzle ORM.

## Prerequisites
- Node.js >= 20
- pnpm (if needed: `corepack enable pnpm`)

## Install
```bash
pnpm install
```

## Run
- Dev server (pushes Drizzle schema to SQLite first):
  ```bash
  pnpm dev
  ```

## Test
- All tests: `pnpm test`
- Unit only: `pnpm test:unit`
- Integration only: `pnpm test:integration`

## Lint
```bash
pnpm lint
```

## Project Layout (key paths)
- Fastify entry: `src/fastify.ts`, `src/main.ts`
- DI setup: `src/di/di.context.ts`
- Controller: `src/controllers/my-controller.ts`
- Order orchestration: `src/services/impl/order-processor.service.ts`
- Product handlers: `src/services/impl/product-handlers/*-handler/`
- Notifications port/impl: `src/services/notifications.port.ts`, `src/services/impl/notification.service.ts`
- Database schema: `src/db/schema.ts`
- Tests: `src/services/impl/product-handlers/*-handler/*.spec.ts`, `src/controllers/my-controller.integration.spec.ts`

## Notes
- Uses ESM; imports include `.js` extensions.
- SQLite database lives in `database.db` for dev; integration tests create and clean their own DB with `.env.test`.
