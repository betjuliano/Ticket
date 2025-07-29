'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou senha incorretos'
      case 'AccessDenied':
        return 'Acesso negado'
      case 'Verification':
        return 'Token de verificação inválido'
      default:
        return 'Erro de autenticação'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Erro de Autenticação
          </CardTitle>
          <CardDescription className="text-gray-400">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/signin">
              Tentar Novamente
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}