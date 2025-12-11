import {
	describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import {mockDeep, type DeepMockProxy} from 'vitest-mock-extended';
import {type INotificationService} from '../../../notifications.port.js';
import {createDatabaseMock, cleanUp} from '../../../../utils/test-utils/database-tools.ts.js';
import {ExpirableProductHandler} from './expirable-product.handler.js';
import {products, type Product} from '@/db/schema.js';
import {type Database} from '@/db/type.js';

describe('ExpirableProductHandler', () => {
	let notificationServiceMock: DeepMockProxy<INotificationService>;
	let handler: ExpirableProductHandler;
	let databaseMock: Database;
	let databaseName: string;

	beforeEach(async () => {
		({databaseMock, databaseName} = await createDatabaseMock());
		notificationServiceMock = mockDeep<INotificationService>();
		handler = new ExpirableProductHandler({db: databaseMock, ns: notificationServiceMock});
	});

	afterEach(async () => cleanUp(databaseName));

	it('decrements stock when not expired and in stock', async () => {
		const now = Date.now();
		const product: Product = {
			id: 10,
			leadTime: 0,
			available: 5,
			type: 'EXPIRABLE',
			name: 'Butter',
			expiryDate: new Date(now + (10 * 24 * 60 * 60 * 1000)),
			seasonStartDate: null,
			seasonEndDate: null,
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(product.available).toBe(4);
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.available).toBe(4);
		expect(notificationServiceMock.sendExpirationNotification).not.toHaveBeenCalled();
	});

	it('marks unavailable and notifies when expired or out of stock', async () => {
		const now = Date.now();
		const product: Product = {
			id: 11,
			leadTime: 0,
			available: 0,
			type: 'EXPIRABLE',
			name: 'Milk',
			expiryDate: new Date(now - (2 * 24 * 60 * 60 * 1000)),
			seasonStartDate: null,
			seasonEndDate: null,
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(notificationServiceMock.sendExpirationNotification).toHaveBeenCalledWith(product.name, product.expiryDate!);
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.available).toBe(0);
	});
});
