/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
/* eslint-disable max-depth */
/* eslint-disable no-await-in-loop */
import {type Order} from '@/db/schema.js';
import fastifyPlugin from 'fastify-plugin';
import {serializerCompiler, validatorCompiler, type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {orders, products} from '@/db/schema.js';

export const myController = fastifyPlugin(async server => {
	// Add schema validator and serializer
	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);

	server.withTypeProvider<ZodTypeProvider>().post('/orders/:orderId/processOrder', {
		schema: {
			params: z.object({
				orderId: z.coerce.number().int().positive('orderId must be positive !'),
			}),
		},
	}, async (request, reply) => {
		const orderProcessor = request.diScope.resolve('orderProcessor');
		const order = await orderProcessor.processOrder(request.params.orderId) as Order;
		await reply.send({orderId: order.id});
	});
});

