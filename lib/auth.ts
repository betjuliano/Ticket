import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.isActive) {
          throw new Error('Usuário não encontrado ou inativo')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Senha incorreta')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}

// Funções auxiliares para autenticação
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateJWT = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' })
}

export const verifyJWT = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new Error('Token inválido')
  }
}

// Middleware de autorização
export const requireAuth = (handler: any) => {
  return async (req: any, res: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' })
      }

      const decoded = verifyJWT(token)
      req.user = decoded
      
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' })
    }
  }
}

// Middleware de autorização por role
export const requireRole = (roles: string[]) => {
  return (handler: any) => {
    return async (req: any, res: any) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return res.status(401).json({ error: 'Token não fornecido' })
        }

        const decoded = verifyJWT(token)
        
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ error: 'Acesso negado' })
        }

        req.user = decoded
        return handler(req, res)
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' })
      }
    }
  }
}

// Adicione esta declaração de módulo para estender os tipos do NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
  
  interface User {
    id: string;
    role?: string;
  }
}