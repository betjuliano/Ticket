import Redis from 'ioredis'

class CacheService {
  private redis: Redis | null = null
  private isConnected = false

  constructor() {
    this.connect()
  }

  private async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      await this.redis.ping()
      this.isConnected = true
      console.log('✅ Redis conectado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error)
      this.isConnected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache invalidate error:', error)
      return false
    }
  }
}

export const cacheService = new CacheService()

// Middleware para cache de API
export function withCache(handler: any, ttl: number = 300) {
  return async (req: any, res: any) => {
    const cacheKey = `api:${req.url}:${JSON.stringify(req.query)}`
    
    // Tentar buscar do cache
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Executar handler original
    const originalJson = res.json
    res.json = function(data: any) {
      // Salvar no cache
      cacheService.set(cacheKey, data, ttl)
      return originalJson.call(this, data)
    }

    return handler(req, res)
  }
}