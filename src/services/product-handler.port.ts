import {type Product} from '@/db/schema.js';

/**
 * IProductHandler is the strategy interface for handling different product types.
 * Each product type (NORMAL, SEASONAL, EXPIRABLE) implements this interface.
 *
 * This follows the Strategy Pattern - allows runtime selection of algorithm
 * without the need for switch statements or if-else chains.
 */
export type IProductHandler = {
	/**
	 * Determines if this handler can process the given product type.
	 * Used to find the right handler for a product.
	 *
	 * @param product - The product to check
	 * @returns true if this handler should process this product
	 */
	canHandle(product: Product): boolean;

	/**
	 * Processes the order for this product type.
	 * Handles stock decrement, date checks, notifications, database updates, etc.
	 *
	 * @param product - The product to process
	 */
	processOrder(product: Product): Promise<void>;
};
