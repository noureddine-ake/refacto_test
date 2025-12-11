import {eq} from 'drizzle-orm';
import {type IProductHandler} from '../product-handler.port.js';
import {orders, type products, type Order} from '@/db/schema.js';
import {type Database} from '@/db/type.js';

/**
 * OrderProcessor orchestrates the order processing workflow.
 *
 * Responsibilities:
 * - Fetch order data from database
 * - Loop through products in the order
 * - Delegate to appropriate handler based on product type
 *
 * This removes the massive switch statement from the controller
 * and centralizes order processing logic.
 */
export class OrderProcessor {
	private readonly db: Database;
	private readonly handlers: IProductHandler[];

	public constructor(
		{db, handlers}: {
			db: Database;
			handlers: IProductHandler[];
		},
	) {
		this.db = db;
		this.handlers = handlers;
	}

	/**
	 * Main entry point: process an order by ID.
	 *
	 * Steps:
	 * 1. Fetch order with all its products from database
	 * 2. For each product, find the appropriate handler
	 * 3. Delegate to that handler for processing
	 * 4. Return the processed order
	 *
	 * @param orderId - The ID of the order to process
	 * @returns The processed order
	 */
	public async processOrder(orderId: number): Promise<Order> {
		// Step 1: Fetch order with all products
		const order = (await this.db.query.orders
			.findFirst({
				where: eq(orders.id, orderId),
				with: {
					products: {
						columns: {},
						with: {
							product: true,
						},
					},
				},
			}))!;

		// Step 2 & 3: Process each product with appropriate handler
		if (order.products && order.products.length > 0) {
			const items = order.products as Array<{product: typeof products.$inferSelect}>;
			await Promise.all(items.map(async ({product}) => {
				await this.processProduct(product);
			}));
		}

		return order;
	}

	/**
	 * Process a single product by finding and using the appropriate handler.
	 *
	 * @param product - The product to process
	 * @throws Error if no handler found for product type
	 */
	private async processProduct(product: typeof products.$inferSelect): Promise<void> {
		// Find the handler that can handle this product type
		const handler = this.handlers.find(h => h.canHandle(product));

		if (!handler) {
			throw new Error(`No handler found for product type: ${product.type}`);
		}

		// Delegate to handler
		await handler.processOrder(product);
	}
}
