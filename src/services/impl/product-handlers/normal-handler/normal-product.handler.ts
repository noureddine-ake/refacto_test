import {eq} from 'drizzle-orm';
import {type Cradle} from '@fastify/awilix';
import {type IProductHandler} from '../../../product-handler.port.js';
import {type INotificationService} from '../../../notifications.port.js';
import {type Product, products} from '@/db/schema.js';
import {type Database} from '@/db/type.js';
import {ProductType} from '@/domain/product-type.js';

export class NormalProductHandler implements IProductHandler {
	private readonly db: Database;
	private readonly notifications: INotificationService;

	public constructor({db, ns}: Pick<Cradle, 'db' | 'ns'>) {
		this.db = db;
		this.notifications = ns;
	}

	public canHandle(product: Product): boolean {
		return product.type === ProductType.Normal;
	}

	public async processOrder(product: Product): Promise<void> {
		if (product.available > 0) {
			product.available -= 1;
			await this.db.update(products).set(product).where(eq(products.id, product.id));
			return;
		}

		if (product.leadTime > 0) {
			await this.notifyDelay(product.leadTime, product);
		}
	}

	private async notifyDelay(leadTime: number, product: Product): Promise<void> {
		product.leadTime = leadTime;
		await this.db.update(products).set(product).where(eq(products.id, product.id));
		this.notifications.sendDelayNotification(leadTime, product.name);
	}
}
