import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import { healthRoutes } from './routes/health'
import { userRoutes } from './routes/users'

const prisma = new PrismaClient()

const fastify = Fastify({
  logger: true
})

// Register CORS
fastify.register(cors, {
  origin: true
})

// Register Swagger
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'EquiOps API',
      description: 'EquiOps API documentation',
      version: '1.0.0'
    },
    host: 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
})

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true
})

// Register routes
fastify.register(healthRoutes)
fastify.register(userRoutes, { prefix: '/api' })

// Add Prisma to Fastify instance
fastify.decorate('prisma', prisma)

// Graceful shutdown
fastify.addHook('onClose', async (instance) => {
  await instance.prisma.$disconnect()
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log('🚀 Server ready at http://localhost:3001')
    console.log('📚 API docs available at http://localhost:3001/docs')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()