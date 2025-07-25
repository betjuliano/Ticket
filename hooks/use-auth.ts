import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  identificationType: 'matricula' | 'telefone'
  matricula?: string
  telefone?: string
}

interface UseAuthReturn {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const login = async (data: LoginData) => {
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso'
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer login',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      await signOut({ redirect: false })
      
      toast({
        title: 'Sucesso',
        description: 'Logout realizado com sucesso'
      })
      
      router.push('/auth/signin')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao criar conta')
      }

      toast({
        title: 'Sucesso',
        description: 'Conta criada com sucesso! Faça login para continuar.'
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao enviar email de recuperação')
      }

      toast({
        title: 'Sucesso',
        description: 'Email de recuperação enviado com sucesso'
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao redefinir senha')
      }

      toast({
        title: 'Sucesso',
        description: 'Senha redefinida com sucesso'
      })

      router.push('/auth/signin')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading' || isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword
  }
}