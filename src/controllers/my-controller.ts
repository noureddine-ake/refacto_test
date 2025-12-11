
import fastifyPlugin from 'fastify-plugin';
import {serializerCompiler, validatorCompiler, type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {type Order} from '@/db/schema.js';

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
		const order: Order = await orderProcessor.processOrder(request.params.orderId);
		await reply.send({orderId: order.id});
	});
});
