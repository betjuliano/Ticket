import Redis from 'ioredis'

// Configuração do Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// Interface para cache
interface CacheOptions {
  ttl?: number // Time to live em segundos
  prefix?: string
}

class CacheManager {
  private defaultTTL = 3600 // 1 hora
  private defaultPrefix = 'ticket_system'

  constructor() {
    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  // Gerar chave de cache
  private generateKey(key: string, prefix?: string): string {
    const cachePrefix = prefix || this.defaultPrefix
    return `${cachePrefix}:${key}`
  }

  // Definir valor no cache
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const ttl = options.ttl || this.defaultTTL
      const serializedValue = JSON.stringify(value)
      
      await redis.setex(cacheKey, ttl, serializedValue)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Obter valor do cache
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const value = await redis.get(cacheKey)
      
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Deletar valor do cache
  async del(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      await redis.del(cacheKey)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Deletar múltiplas chaves por padrão
  async delPattern(pattern: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cachePattern = this.generateKey(pattern, options.prefix)
      const keys = await redis.keys(cachePattern)
      
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  // Verificar se chave existe
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const result = await redis.exists(cacheKey)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Incrementar contador
  async incr(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const result = await redis.incr(cacheKey)
      
      // Definir TTL se especificado
      if (options.ttl) {
        await redis.expire(cacheKey, options.ttl)
      }
      
      return result
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  // Obter ou definir (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar obter do cache primeiro
    const cachedValue = await this.get<T>(key, options)
    
    if (cachedValue !== null) {
      return cachedValue
    }

    // Se não estiver no cache, buscar da fonte
    const value = await fetchFunction()
    
    // Armazenar no cache
    await this.set(key, value, options)
    
    return value
  }

  // Invalidar cache relacionado a tickets
  async invalidateTicketCache(ticketId?: string): Promise<void> {
    const patterns = [
      'tickets:*',
      'dashboard:stats:*',
      'user:tickets:*'
    ]

    if (ticketId) {
      patterns.push(`ticket:${ticketId}:*`)
    }

    for (const pattern of patterns) {
      await this.delPattern(pattern)
    }
  }

  // Invalidar cache relacionado a usuários
  async invalidateUserCache(userId?: string): Promise<void> {
    const patterns = [
      'users:*',
      'user:sessions:*'
    ]

    if (userId) {
      patterns.push(`user:${userId}:*`)
    }

    for (const pattern of patterns) {
      await this.delPattern(pattern)
    }
  }

  // Invalidar cache relacionado à base de conhecimento
  async invalidateKnowledgeCache(): Promise<void> {
    await this.delPattern('knowledge:*')
    await this.delPattern('search:knowledge:*')
  }

  // Limpar todo o cache
  async clear(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Obter estatísticas do cache
  async getStats(): Promise<any> {
    try {
      const info = await redis.info('memory')
      const keyspace = await redis.info('keyspace')
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redis.status === 'ready'
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return null
    }
  }

  // Fechar conexão
  async disconnect(): Promise<void> {
    await redis.disconnect()
  }
}

// Instância singleton do cache
export const cache = new CacheManager()

// Decorador para cache de métodos
export function cached(ttl: number = 3600, keyPrefix?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix || propertyName}:${JSON.stringify(args)}`
      
      return cache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        { ttl, prefix: keyPrefix }
      )
    }
  }
}

export default cache

