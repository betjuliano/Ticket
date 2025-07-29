'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Mail, Lock, GraduationCap, User, Phone, IdCard, Info, KeyRound } from 'lucide-react'

interface RegisterData {
  name: string
  email: string
  identificationType: 'matricula' | 'telefone'
  matricula: string
  telefone: string
  password: string
  confirmPassword: string
}

export default function AuthPage() {
  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  
  // Register state
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    identificationType: 'matricula',
    matricula: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  
  // Common state
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Link de recuperação enviado para seu email!')
        setForgotEmail('')
        setTimeout(() => {
          setShowForgotPassword(false)
          setSuccess('')
        }, 3000)
      } else {
        setError(data.message || 'Erro ao enviar email de recuperação')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 11)
    return limited
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validações
    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (!registerData.email.includes('@')) {
      setError('Email inválido')
      setIsLoading(false)
      return
    }

    if (registerData.identificationType === 'matricula' && registerData.matricula.length < 5) {
      setError('Matrícula deve ter pelo menos 5 caracteres')
      setIsLoading(false)
      return
    }

    if (registerData.identificationType === 'telefone' && registerData.telefone.length < 10) {
      setError('Telefone deve ter pelo menos 10 dígitos (DDD + número)')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          identificationType: registerData.identificationType,
          matricula: registerData.identificationType === 'matricula' ? registerData.matricula : null,
          telefone: registerData.identificationType === 'telefone' ? registerData.telefone : null,
          password: registerData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Cadastro realizado com sucesso! Você pode fazer login agora.')
        setActiveTab('login')
        setRegisterData({
          name: '',
          email: '',
          identificationType: 'matricula',
          matricula: '',
          telefone: '',
          password: '',
          confirmPassword: ''
        })
      } else {
        setError(data.message || 'Erro ao criar conta')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const updateRegisterData = (field: keyof RegisterData, value: string) => {
    if (field === 'telefone') {
      value = formatTelefone(value)
    }
    setRegisterData(prev => ({ ...prev, [field]: value }))
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-4 shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
            <p className="text-blue-200">Digite seu email para receber o link de recuperação</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardContent className="pt-6">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-200 mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-500/10 border-green-500/20 text-green-200 mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-white font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {forgotPasswordLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      'Enviar Link de Recuperação'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Curso Administração UFSM</h1>
          <p className="text-blue-200">Portal do Aluno(a)</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-white">
              {activeTab === 'login' ? 'Acesso ao Sistema' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-center text-blue-200">
              {activeTab === 'login' 
                ? 'Entre com suas credenciais para acessar o portal'
                : 'Preencha os dados para criar sua conta'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
                <TabsTrigger 
                  value="login" 
                  className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Cadastro
                </TabsTrigger>
              </TabsList>
              
              {/* Alerts */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-200 mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-500/10 border-green-500/20 text-green-200 mt-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-6 mt-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Entrando...
                        </div>
                      ) : (
                        'Entrar no Sistema'
                      )}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-blue-300 hover:text-white text-sm underline transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4 mt-6">
                {/* Observação para não-alunos */}
                <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Observação:</strong> Se você não for aluno(a) da UFSM, pode fazer o cadastro igualmente. O sistema é aberto para toda a comunidade.
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white font-medium">
                      Nome Completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={registerData.name}
                        onChange={(e) => updateRegisterData('name', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={registerData.email}
                        onChange={(e) => updateRegisterData('email', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Tipo de Identificação */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium">
                      Tipo de Identificação *
                    </Label>
                    <Select 
                      value={registerData.identificationType} 
                      onValueChange={(value: 'matricula' | 'telefone') => updateRegisterData('identificationType', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="matricula" className="text-white hover:bg-slate-700">
                          Matrícula (Aluno UFSM)
                        </SelectItem>
                        <SelectItem value="telefone" className="text-white hover:bg-slate-700">
                          Telefone (Comunidade)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo dinâmico: Matrícula ou Telefone */}
                  {registerData.identificationType === 'matricula' ? (
                    <div className="space-y-2">
                      <Label htmlFor="register-matricula" className="text-white font-medium">
                        Matrícula *
                      </Label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                        <Input
                          id="register-matricula"
                          type="text"
                          placeholder="Número da matrícula"
                          value={registerData.matricula}
                          onChange={(e) => updateRegisterData('matricula', e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="register-telefone" className="text-white font-medium">
                        Telefone (DDD + Número) *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                        <Input
                          id="register-telefone"
                          type="tel"
                          placeholder="55999999999"
                          value={registerData.telefone}
                          onChange={(e) => updateRegisterData('telefone', e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          required
                          maxLength={11}
                        />
                      </div>
                      <p className="text-xs text-blue-300 mt-1">
                        Exemplo: 55999999999 (DDD + número sem espaços ou símbolos)
                      </p>
                    </div>
                  )}
                  
                  {/* Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white font-medium">
                      Senha *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password}
                        onChange={(e) => updateRegisterData('password', e.target.value)}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                      >
                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Confirmar Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-white font-medium">
                      Confirmar Senha *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua senha"
                        value={registerData.confirmPassword}
                        onChange={(e) => updateRegisterData('confirmPassword', e.target.value)}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Criando conta...
                      </div>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-blue-200 text-sm">
                Problemas para acessar?{' '}
                <a href="#" className="text-blue-300 hover:text-white underline transition-colors">
                  Entre em contato
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-300 text-sm">
            Desenvolvido por Ia projetos - Prof. Juliano
            2025 Universidade Federal de Santa Maria
            
          </p>
        </div>
      </div>
    </div>
  )
}