import {
	describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import {mockDeep, type DeepMockProxy} from 'vitest-mock-extended';
import {type INotificationService} from '../../../notifications.port.js';
import {createDatabaseMock, cleanUp} from '../../../../utils/test-utils/database-tools.ts.js';
import {NormalProductHandler} from './normal-product.handler.js';
import {products, type Product} from '@/db/schema.js';
import {type Database} from '@/db/type.js';

describe('NormalProductHandler', () => {
	let notificationServiceMock: DeepMockProxy<INotificationService>;
	let handler: NormalProductHandler;
	let databaseMock: Database;
	let databaseName: string;

	beforeEach(async () => {
		({databaseMock, databaseName} = await createDatabaseMock());
		notificationServiceMock = mockDeep<INotificationService>();
		handler = new NormalProductHandler({db: databaseMock, ns: notificationServiceMock});
	});

	afterEach(async () => cleanUp(databaseName));

	it('decrements stock when available', async () => {
		const product: Product = {
			id: 100,
			leadTime: 0,
			available: 3,
			type: 'NORMAL',
			name: 'RJ45 Cable',
			expiryDate: null,
			seasonStartDate: null,
			seasonEndDate: null,
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(product.available).toBe(2);
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.available).toBe(2);
		expect(notificationServiceMock.sendDelayNotification).not.toHaveBeenCalled();
	});

	it('notifies delay when out of stock with lead time', async () => {
		const product: Product = {
			id: 101,
			leadTime: 7,
			available: 0,
			type: 'NORMAL',
			name: 'USB Dongle',
			expiryDate: null,
			seasonStartDate: null,
			seasonEndDate: null,
		};
		await databaseMock.insert(products).values(product);

		await handler.processOrder(product);

		expect(notificationServiceMock.sendDelayNotification).toHaveBeenCalledWith(7, 'USB Dongle');
		const stored = await databaseMock.query.products.findFirst({where: (p, {eq}) => eq(p.id, product.id)});
		expect(stored!.leadTime).toBe(7);
	});
});
