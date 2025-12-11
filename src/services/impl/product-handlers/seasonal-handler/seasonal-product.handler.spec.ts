import {
	describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import {mockDeep, type DeepMockProxy} from 'vitest-mock-extended';
import {type INotificationService} from '../../../notifications.port.js';
import {createDatabaseMock, cleanUp} from '../../../../utils/test-utils/database-tools.ts.js';
import {SeasonalProductHandler} from './seasonal-product.handler.js';
import {products, type Product} from '@/db/schema.js';
import {type Database} from '@/db/type.js';

describe('SeasonalProductHandler', () => {
	let notificationServiceMock: DeepMockProxy<INotificationService>;
	let handler: SeasonalProductHandler;
	let databaseMock: Database;
	let databaseName: string;

	beforeEach(async () => {
		({databaseMock, databaseName} = await createDatabaseMock());
		notificationServiceMock = mockDeep<INotificationService>();
		handler = new SeasonalProductHandler({db: databaseMock, ns: notificationServiceMock});
	});

	afterEach(async () => cleanUp(databaseName));

	it('decrements stock when in season and available', async () => {
		const now = Date.now();
		const product: Product = {
			id: 1,
			leadTime: 5,
			available: 10,
			type: 'SEASONAL',
			name: 'Watermelon',
			expiryDate: null,
			seasonStartDate: new Date(now - (2 * 24 * 60 * 60 * 1000)),
			seasonEndDate: new Date(now + (30 * 24 * 60 * 60 * 1000)),
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(product.available).toBe(9);
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.available).toBe(9);
		expect(notificationServiceMock.sendOutOfStockNotification).not.toHaveBeenCalled();
		expect(notificationServiceMock.sendDelayNotification).not.toHaveBeenCalled();
	});

	it('marks unavailable and notifies when lead time exceeds season end', async () => {
		const now = Date.now();
		const product: Product = {
			id: 2,
			leadTime: 60,
			available: 0,
			type: 'SEASONAL',
			name: 'Strawberries',
			expiryDate: null,
			seasonStartDate: new Date(now - (2 * 24 * 60 * 60 * 1000)),
			seasonEndDate: new Date(now + (10 * 24 * 60 * 60 * 1000)),
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(notificationServiceMock.sendOutOfStockNotification).toHaveBeenCalledWith(product.name);
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.available).toBe(0);
	});

	it('notifies out of stock when before season start', async () => {
		const now = Date.now();
		const product: Product = {
			id: 3,
			leadTime: 5,
			available: 0,
			type: 'SEASONAL',
			name: 'Grapes',
			expiryDate: null,
			seasonStartDate: new Date(now + (180 * 24 * 60 * 60 * 1000)),
			seasonEndDate: new Date(now + (240 * 24 * 60 * 60 * 1000)),
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(notificationServiceMock.sendOutOfStockNotification).toHaveBeenCalledWith(product.name);
	});
});
