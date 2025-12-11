import {eq} from 'drizzle-orm';
import {type Cradle} from '@fastify/awilix';
import {type IProductHandler} from '../../product-handler.port.js';
import {type Product, products} from '@/db/schema.js';
import {type Database} from '@/db/type.js';
import {type INotificationService} from '../../notifications.port.js';
import {ProductType} from '@/domain/product-type.js';

export class ExpirableProductHandler implements IProductHandler {
	private readonly db: Database;
	private readonly notifications: INotificationService;

	public constructor({db, ns}: Pick<Cradle, 'db' | 'ns'>) {
		this.db = db;
		this.notifications = ns;
	}

	public canHandle(product: Product): boolean {
		return product.type === ProductType.Expirable;
	}

	public async processOrder(product: Product): Promise<void> {
		const now = new Date();
		const hasStock = product.available > 0;
		const notExpired = product.expiryDate! > now;

		if (hasStock && notExpired) {
			product.available -= 1;
			await this.db.update(products).set(product).where(eq(products.id, product.id));
			return;
		}

		this.notifications.sendExpirationNotification(product.name, product.expiryDate!);
		product.available = 0;
		await this.db.update(products).set(product).where(eq(products.id, product.id));
	}
}
