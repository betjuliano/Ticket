import { createClient } from '@supabase/supabase-js'

// Supabase configuration should rely solely on environment variables.
// Never hard-code secrets or fallback keys in the codebase. When the required
// variables are not present the client will be initialized with empty strings,
// which will cause requests to fail fast and alert maintainers to properly
// configure the environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

let cachedAdminClient: ReturnType<typeof createClient> | null = null
export const getSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Variável de ambiente ausente: SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  }
  return cachedAdminClient
}

// Helper para validar a existência de variáveis de ambiente necessárias
export const validateSupabaseEnv = (): void => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Variável de ambiente ausente: ${key}`)
    }
  })
}

// Helper para criação de usuário usando o client administrativo
export interface CreateUserParams {
  email: string
  password: string
  metadata?: Record<string, unknown>
}

export const createUser = async ({ email, password, metadata }: CreateUserParams) => {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: metadata,
    email_confirm: true
  })

  if (error) throw error
  return data.user
}

// Helper genérico para leitura de tabelas
export const readTable = async (table: string) => {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return data
}
