import Redis from 'ioredis';

/**
 * Sistema de Cache Redis para Otimização de Performance
 * 
 * Este módulo implementa um sistema de cache robusto usando Redis para:
 * - Cache de consultas frequentes
 * - Cache de sessões de usuário
 * - Cache de dados de tickets
 * - Cache de configurações do sistema
 * 
 * Características:
 * - Conexão pool otimizada
 * - Serialização/deserialização automática
 * - TTL configurável
 * - Fallback para cache em memória
 * - Logs detalhados para debugging
 */

// Configurações do Redis
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Prefixos para diferentes tipos de cache
const CACHE_PREFIXES = {
  TICKETS: 'tickets:',
  USERS: 'users:',
  SESSIONS: 'sessions:',
  CONFIG: 'config:',
  API: 'api:',
  STATS: 'stats:',
} as const;

// TTL padrão para diferentes tipos de dados (em segundos)
const DEFAULT_TTL = {
  TICKETS: 300, // 5 minutos
  USERS: 1800, // 30 minutos
  SESSIONS: 3600, // 1 hora
  CONFIG: 86400, // 24 horas
  API: 60, // 1 minuto
  STATS: 300, // 5 minutos
} as const;

/**
 * Classe principal do sistema de cache
 */
export class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Inicializar conexão com Redis
   * Implementa fallback para cache em memória se Redis não estiver disponível
   */
  private async initializeRedis() {
    try {
      const redisConfig: any = {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db,
        retryDelayOnFailover: REDIS_CONFIG.retryDelayOnFailover,
        maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
        lazyConnect: REDIS_CONFIG.lazyConnect,
        keepAlive: REDIS_CONFIG.keepAlive,
        connectTimeout: REDIS_CONFIG.connectTimeout,
        commandTimeout: REDIS_CONFIG.commandTimeout,
      };
      
      // Adicionar password apenas se existir
      if (REDIS_CONFIG.password) {
        redisConfig.password = REDIS_CONFIG.password;
      }
      
      this.redis = new Redis(redisConfig);
      
      this.redis.on('connect', () => {
        console.log('✅ Redis conectado com sucesso');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.error('❌ Erro na conexão Redis:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('🔌 Conexão Redis fechada');
        this.isConnected = false;
      });

      // Testar conexão
      await this.redis.ping();
      
    } catch (error) {
      console.warn('⚠️ Redis não disponível, usando cache em memória:', error);
      this.isConnected = false;
    }
  }

  /**
   * Gerar chave de cache com prefixo
   */
  private generateKey(prefix: keyof typeof CACHE_PREFIXES, key: string): string {
    return `${CACHE_PREFIXES[prefix]}${key}`;
  }

  /**
   * Serializar dados para armazenamento
   */
  private serialize(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Erro ao serializar dados:', error);
      return JSON.stringify({ error: 'Serialization failed' });
    }
  }

  /**
   * Deserializar dados do armazenamento
   */
  private deserialize(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao deserializar dados:', error);
      return null;
    }
  }

  /**
   * Armazenar dados no cache
   */
  async set(
    prefix: keyof typeof CACHE_PREFIXES,
    key: string,
    data: any,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);
    const serializedData = this.serialize(data);
    const cacheTTL = ttl || DEFAULT_TTL[prefix];

    try {
      if (this.isConnected && this.redis) {
        // Usar Redis
        await this.redis.setex(cacheKey, cacheTTL, serializedData);
      } else {
        // Fallback para cache em memória
        this.memoryCache.set(cacheKey, {
          data: serializedData,
          timestamp: Date.now(),
          ttl: cacheTTL * 1000,
        });
      }
    } catch (error) {
      console.error('Erro ao armazenar no cache:', error);
      // Fallback para memória em caso de erro
      this.memoryCache.set(cacheKey, {
        data: serializedData,
        timestamp: Date.now(),
        ttl: cacheTTL * 1000,
      });
    }
  }

  /**
   * Recuperar dados do cache
   */
  async get<T = any>(
    prefix: keyof typeof CACHE_PREFIXES,
    key: string
  ): Promise<T | null> {
    const cacheKey = this.generateKey(prefix, key);

    try {
      let cachedData: string | null = null;

      if (this.isConnected && this.redis) {
        // Tentar Redis primeiro
        cachedData = await this.redis.get(cacheKey);
      }

      if (!cachedData) {
        // Fallback para cache em memória
        const memoryItem = this.memoryCache.get(cacheKey);
        if (memoryItem) {
          const now = Date.now();
          if (now - memoryItem.timestamp < memoryItem.ttl) {
            cachedData = memoryItem.data;
          } else {
            // Remover item expirado
            this.memoryCache.delete(cacheKey);
          }
        }
      }

      if (cachedData) {
        const deserialized = this.deserialize(cachedData);
        return deserialized;
      }

      return null;
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      return null;
    }
  }

  /**
   * Remover dados do cache
   */
  async delete(prefix: keyof typeof CACHE_PREFIXES, key: string): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);

    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(cacheKey);
      }
      
      // Remover também da memória
      this.memoryCache.delete(cacheKey);
    } catch (error) {
      console.error('Erro ao deletar do cache:', error);
    }
  }

  /**
   * Verificar se dados existem no cache
   */
  async exists(prefix: keyof typeof CACHE_PREFIXES, key: string): Promise<boolean> {
    const cacheKey = this.generateKey(prefix, key);

    try {
      if (this.isConnected && this.redis) {
        const exists = await this.redis.exists(cacheKey);
        return exists === 1;
      } else {
        return this.memoryCache.has(cacheKey);
      }
    } catch (error) {
      console.error('Erro ao verificar existência no cache:', error);
      return false;
    }
  }

  /**
   * Limpar cache por prefixo
   */
  async clearPrefix(prefix: keyof typeof CACHE_PREFIXES): Promise<void> {
    try {
      if (this.isConnected && this.redis) {
        const pattern = `${CACHE_PREFIXES[prefix]}*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Limpar também da memória
      const memoryKeys = Array.from(this.memoryCache.keys());
      const prefixToClear = CACHE_PREFIXES[prefix];
      memoryKeys.forEach(key => {
        if (key.startsWith(prefixToClear)) {
          this.memoryCache.delete(key);
        }
      });
    } catch (error) {
      console.error('Erro ao limpar prefixo do cache:', error);
    }
  }

  /**
   * Limpar todo o cache
   */
  async clearAll(): Promise<void> {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.flushdb();
      }
      
      this.memoryCache.clear();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<{
    redisConnected: boolean;
    memoryCacheSize: number;
    memoryCacheKeys: string[];
  }> {
    return {
      redisConnected: this.isConnected,
      memoryCacheSize: this.memoryCache.size,
      memoryCacheKeys: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Cache de tickets com invalidação inteligente
   */
  async cacheTicket(ticketId: string, ticketData: any): Promise<void> {
    await this.set('TICKETS', ticketId, ticketData, 3600); // 1 hora
  }

  async getTicket<T = any>(ticketId: string): Promise<T | null> {
    return await this.get<T>('TICKETS', ticketId);
  }

  async invalidateTicket(ticketId: string): Promise<void> {
    await this.delete('TICKETS', ticketId);
  }

  /**
   * Cache de listas de tickets
   */
  async cacheTicketList(filters: string, tickets: any[]): Promise<void> {
    await this.set('TICKETS', `list:${filters}`, tickets, 1800); // 30 minutos
  }

  async getTicketList<T = any>(filters: string): Promise<T | null> {
    return await this.get<T>('TICKETS', `list:${filters}`);
  }

  /**
   * Cache de usuários
   */
  async cacheUser(userId: string, userData: any): Promise<void> {
    await this.set('USERS', userId, userData, 7200); // 2 horas
  }

  async getUser<T = any>(userId: string): Promise<T | null> {
    return await this.get<T>('USERS', userId);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.delete('USERS', userId);
  }

  /**
   * Cache de sessões
   */
  async cacheSession(sessionId: string, sessionData: any): Promise<void> {
    await this.set('SESSIONS', sessionId, sessionData, 3600); // 1 hora
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await this.get<T>('SESSIONS', sessionId);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.delete('SESSIONS', sessionId);
  }

  /**
   * Cache de configurações
   */
  async cacheConfig(configKey: string, configData: any): Promise<void> {
    await this.set('CONFIG', configKey, configData, 86400); // 24 horas
  }

  async getConfig<T = any>(configKey: string): Promise<T | null> {
    return await this.get<T>('CONFIG', configKey);
  }

  /**
   * Cache de estatísticas
   */
  async cacheStats(statsKey: string, statsData: any): Promise<void> {
    await this.set('STATS', statsKey, statsData, 1800); // 30 minutos
  }

  async getStatsData<T = any>(statsKey: string): Promise<T | null> {
    return await this.get<T>('STATS', statsKey);
  }

  /**
   * Fechar conexão Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService();

// Exportar a instância diretamente para uso
export default cacheService;
