import { supabase } from './lib/supabase.ts'

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('_realtime_schema_migrations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
    } else {
      console.log('✅ Conexão com Supabase funcionando!')
      console.log('📊 Dados recebidos:', data)
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
  }
}

testConnection()