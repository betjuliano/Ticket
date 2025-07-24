import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.iaprojetos.com.br'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.xJC17_8X58Xg6w9odMaPrIfuR88v6stIW0ymnfVD1cY'

export const supabase = createClient(supabaseUrl, supabaseKey)