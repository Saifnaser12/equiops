export type Environment = 'development' | 'staging' | 'production'

export interface Config {
  environment: Environment
  port: number
  databaseUrl: string
  apiUrl: string
}

export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}