import { useState, useCallback, useRef } from 'react';

// Tipos para o hook de API
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  cacheTime?: number; // Tempo de cache em ms
  retryCount?: number; // Número de tentativas
  retryDelay?: number; // Delay entre tentativas em ms
}

// Cache simples em memória para evitar requisições desnecessárias
const apiCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Hook customizado para operações de API com cache, retry e tratamento de erros
 * 
 * @param baseUrl - URL base da API
 * @param options - Opções de configuração (cache, retry, etc.)
 * @returns Funções e estado para operações de API
 */
export function useApi<T = any>(baseUrl: string = '/api', options: ApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Configurações padrão com fallbacks seguros
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutos
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  /**
   * Função para gerar chave de cache baseada na URL e parâmetros
   */
  const getCacheKey = useCallback((url: string, params?: Record<string, any>) => {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${url}${paramsString}`;
  }, []);

  /**
   * Função para verificar se o cache ainda é válido
   */
  const isCacheValid = useCallback((key: string) => {
    const cached = apiCache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cacheTime;
  }, [cacheTime]);

  /**
   * Função para fazer requisição com retry automático
   */
  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {},
    retryAttempt = 0
  ): Promise<T> => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo controller para esta requisição
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Verificar se a resposta foi cancelada
      if (abortControllerRef.current.signal.aborted) {
        throw new Error('Requisição cancelada');
      }

      // Verificar status da resposta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;

    } catch (error) {
      // Se não foi erro de cancelamento e ainda há tentativas
      if (error instanceof Error && error.message !== 'Requisição cancelada' && retryAttempt < retryCount) {
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryAttempt + 1)));
        return makeRequest(url, options, retryAttempt + 1);
      }

      throw error;
    }
  }, [baseUrl, retryCount, retryDelay]);

  /**
   * Função GET com cache automático
   */
  const get = useCallback(async <TData = T>(
    url: string,
    params?: Record<string, any>
  ): Promise<TData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar cache primeiro
      const cacheKey = getCacheKey(url, params);
      if (isCacheValid(cacheKey)) {
        const cached = apiCache.get(cacheKey);
        setState({ data: cached!.data, loading: false, error: null });
        return cached!.data;
      }

      // Construir URL com parâmetros
      const urlWithParams = params 
        ? `${url}?${new URLSearchParams(params).toString()}`
        : url;

      const data = await makeRequest(urlWithParams);

      // Armazenar no cache
      apiCache.set(cacheKey, { data, timestamp: Date.now() });

      setState({ data, loading: false, error: null });
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [getCacheKey, isCacheValid, makeRequest]);

  /**
   * Função POST
   */
  const post = useCallback(async <TData = T>(
    url: string,
    data: any
  ): Promise<TData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setState({ data: response, loading: false, error: null });
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [makeRequest]);

  /**
   * Função PUT
   */
  const put = useCallback(async <TData = T>(
    url: string,
    data: any
  ): Promise<TData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await makeRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      setState({ data: response, loading: false, error: null });
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [makeRequest]);

  /**
   * Função DELETE
   */
  const del = useCallback(async <TData = T>(url: string): Promise<TData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await makeRequest(url, {
        method: 'DELETE',
      });

      setState({ data: response, loading: false, error: null });
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [makeRequest]);

  /**
   * Função para limpar cache
   */
  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  /**
   * Função para cancelar requisição em andamento
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    clearCache,
    cancelRequest,
  };
} 