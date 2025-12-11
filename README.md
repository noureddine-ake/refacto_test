# Inventory Order Processing API

Fastify service that processes orders using a strategy of product-type handlers (normal, expirable, seasonal) orchestrated by an `OrderProcessor`. Dependencies are managed with Awilix and data is stored in SQLite via Drizzle ORM.

## What I changed and why
- Isolated business logic in `OrderProcessor`: removed the giant controller switch and centralized DB reads + handler delegation so the controller only validates input and returns the response (SRP, easier to test).
- Introduced Strategy pattern (`IProductHandler`) for NORMAL/SEASONAL/EXPIRABLE products so each rule-set lives beside its data needs; adding a new product type no longer touches the controller or processor (open/closed).
- Wired handlers through Awilix DI and inject them as a list into `OrderProcessor`, making dependencies explicit and enabling targeted unit tests with fakes/mocks.
- Clarified business rules per handler (stock decrement, season window, expiry handling, delay/out-of-stock notifications) and kept DB writes localized to each handler for readability.
- Added focused unit tests per handler plus an integration test hitting the HTTP endpoint against SQLite to guard against regressions and prove the wiring works end-to-end.

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

## Exercise the endpoint manually
1) Start dev server: `pnpm dev` (uses `.env.dev`, writes to `database.db` by default).
2) Insert data (e.g., mimic fixtures from `src/controllers/my-controller.integration.spec.ts`).
3) Call the endpoint:  
```bash
curl -X POST http://localhost:8888/orders/<orderId>/processOrder
```
You should receive `{"orderId":<orderId>}` and see stock/notifications handled by the appropriate strategy.

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
- Env selection via `CONFIG_PATH` and `APP_ENV`; see `.env*` files for DB paths/ports.
