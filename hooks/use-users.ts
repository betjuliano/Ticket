import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'COORDINATOR' | 'USER'
  matricula?: string
  telefone?: string
  isActive: boolean
  createdAt: string
}

interface UserFilters {
  role?: string
  active?: boolean
  search?: string
  page?: number
  limit?: number
}

interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: UserFilters
  setFilters: (filters: Partial<UserFilters>) => void
  createUser: (data: any) => Promise<User>
  updateUser: (id: string, data: any) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  refreshUsers: () => Promise<void>
}

export function useUsers(initialFilters: UserFilters = {}): UseUsersReturn {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [filters, setFiltersState] = useState<UserFilters>({
    page: 1,
    limit: 10,
    ...initialFilters
  })

  const fetchUsers = useCallback(async () => {
    if (!session || session.user.role !== 'COORDINATOR') return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/users?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
        if (data.meta) {
          setPagination(data.meta)
        }
      } else {
        throw new Error(data.message || 'Erro ao carregar usuários')
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [session, filters])

  const setFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const createUser = useCallback(async (data: any): Promise<User> => {
    if (!session || session.user.role !== 'COORDINATOR') {
      throw new Error('Acesso negado')
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao criar usuário')
    }

    toast({
      title: 'Sucesso',
      description: 'Usuário criado com sucesso'
    })

    await fetchUsers()
    return result.data
  }, [session, fetchUsers])

  const updateUser = useCallback(async (id: string, data: any): Promise<User> => {
    if (!session || session.user.role !== 'COORDINATOR') {
      throw new Error('Acesso negado')
    }

    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao atualizar usuário')
    }

    toast({
      title: 'Sucesso',
      description: 'Usuário atualizado com sucesso'
    })

    await fetchUsers()
    return result.data
  }, [session, fetchUsers])

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    if (!session || session.user.role !== 'COORDINATOR') {
      throw new Error('Acesso negado')
    }

    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao excluir usuário')
    }

    toast({
      title: 'Sucesso',
      description: 'Usuário excluído com sucesso'
    })

    await fetchUsers()
  }, [session, fetchUsers])

  const refreshUsers = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers
  }
}