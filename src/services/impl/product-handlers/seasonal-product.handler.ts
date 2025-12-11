import {eq} from 'drizzle-orm';
import {type Cradle} from '@fastify/awilix';
import {type IProductHandler} from '../../product-handler.port.js';
import {type Product, products} from '@/db/schema.js';
import {type Database} from '@/db/type.js';
import {type INotificationService} from '../../notifications.port.js';
import {ProductType, ONE_DAY_MS} from '@/domain/product-type.js';

export class SeasonalProductHandler implements IProductHandler {
	private readonly db: Database;
	private readonly notifications: INotificationService;

	public constructor({db, ns}: Pick<Cradle, 'db' | 'ns'>) {
		this.db = db;
		this.notifications = ns;
	}

	public canHandle(product: Product): boolean {
		return product.type === ProductType.Seasonal;
	}

	public async processOrder(product: Product): Promise<void> {
		const now = new Date();
		const inSeason = now >= product.seasonStartDate! && now <= product.seasonEndDate!;
		const hasStock = product.available > 0;

		if (inSeason && hasStock) {
			product.available -= 1;
			await this.db.update(products).set(product).where(eq(products.id, product.id));
			return;
		}

		const deliveryDate = new Date(now.getTime() + (product.leadTime * ONE_DAY_MS));
		if (deliveryDate > product.seasonEndDate!) {
			this.notifications.sendOutOfStockNotification(product.name);
			product.available = 0;
			await this.db.update(products).set(product).where(eq(products.id, product.id));
			return;
		}

		if (now < product.seasonStartDate!) {
			this.notifications.sendOutOfStockNotification(product.name);
			await this.db.update(products).set(product).where(eq(products.id, product.id));
			return;
		}

		await this.notifyDelay(product.leadTime, product);
	}

	private async notifyDelay(leadTime: number, product: Product): Promise<void> {
		product.leadTime = leadTime;
		await this.db.update(products).set(product).where(eq(products.id, product.id));
		this.notifications.sendDelayNotification(leadTime, product.name);
	}
}
