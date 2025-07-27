const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://supabase.iaprojetos.com.br'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.xJC17_8X58Xg6w9odMaPrIfuR88v6stIW0ymnfVD1cY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas disponíveis...')
    
    // Lista de tabelas comuns para testar
    const tablesToCheck = [
      'users', 'profiles', 'tickets', 'messages', 'categories',
      'auth.users', 'storage.buckets', 'storage.objects'
    ]
    
    const existingTables = []
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (!error) {
          console.log(`✅ Tabela '${table}' encontrada`)
          existingTables.push(table)
        }
      } catch (err) {
        // Tabela não existe, continuar
      }
    }
    
    console.log('\n📋 Resumo:')
    if (existingTables.length > 0) {
      console.log(`✅ ${existingTables.length} tabela(s) encontrada(s):`, existingTables)
    } else {
      console.log('ℹ️ Nenhuma tabela encontrada - banco vazio ou sem permissões')
    }
    
  } catch (err) {
    console.error('❌ Erro:', err)
  }
}

checkTables()