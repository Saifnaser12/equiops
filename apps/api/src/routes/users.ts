import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

export async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all users
  fastify.get('/users', {
    schema: {
      description: 'Get all users',
      tags: ['users'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    // Mock data for now - replace with actual Prisma queries
    const users = [
      {
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    return users
  })

  // Get user by ID
  fastify.get('/users/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    // Mock data for now
    const user = {
      id,
      email: 'john@example.com',
      name: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return user
  })

  // Create user
  fastify.post('/users', {
    schema: {
      description: 'Create a new user',
      tags: ['users'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 }
        },
        required: ['email', 'name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const body = createUserSchema.parse(request.body)
    
    // Mock creation for now
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email: body.email,
      name: body.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    reply.code(201)
    return user
  })
}