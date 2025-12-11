import {type Cradle, diContainer} from '@fastify/awilix';
import {asClass, asValue} from 'awilix';
import {type FastifyBaseLogger, type FastifyInstance} from 'fastify';
import {type INotificationService} from '@/services/notifications.port.js';
import {NotificationService} from '@/services/impl/notification.service.js';
import {type Database} from '@/db/type.js';
import {ProductService} from '@/services/impl/product.service.js';
import {type IProductHandler} from '@/services/product-handler.port.js';
import {NormalProductHandler} from '@/services/impl/product-handlers/normal-product.handler.js';
import {SeasonalProductHandler} from '@/services/impl/product-handlers/seasonal-product.handler.js';
import {ExpirableProductHandler} from '@/services/impl/product-handlers/expirable-product.handler.js';
import {OrderProcessor} from '@/services/impl/order-processor.service.js';

declare module '@fastify/awilix' {

	interface Cradle { // eslint-disable-line @typescript-eslint/consistent-type-definitions
		logger: FastifyBaseLogger;
		db: Database;
		ns: INotificationService;
		ps: ProductService;
		normalProductHandler: IProductHandler;
		seasonalProductHandler: IProductHandler;
		expirableProductHandler: IProductHandler;
		handlers: IProductHandler[];
		orderProcessor: OrderProcessor;
	}
}

export async function configureDiContext(
	server: FastifyInstance,
): Promise<void> {
	diContainer.register({
		logger: asValue(server.log),
	});
	diContainer.register({
		db: asValue(server.database),
	});
	diContainer.register({
		ns: asClass(NotificationService),
	});
	diContainer.register({
		ps: asClass(ProductService),
	});

	// Product handlers
	diContainer.register({
		normalProductHandler: asClass(NormalProductHandler),
		seasonalProductHandler: asClass(SeasonalProductHandler),
		expirableProductHandler: asClass(ExpirableProductHandler),
	});

	// Aggregate handlers
	diContainer.register({
		handlers: asValue([
			diContainer.resolve('normalProductHandler'),
			diContainer.resolve('seasonalProductHandler'),
			diContainer.resolve('expirableProductHandler'),
		]),
	});

	// Order processor
	diContainer.register({
		orderProcessor: asClass(OrderProcessor),
	});
}

export function resolve<Service extends keyof Cradle>(
	service: Service,
): Cradle[Service] {
	return diContainer.resolve(service);
}
