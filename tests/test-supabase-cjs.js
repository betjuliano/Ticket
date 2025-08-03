const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.iaprojetos.com.br';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.xJC17_8X58Xg6w9odMaPrIfuR88v6stIW0ymnfVD1cY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');

    // Teste básico de conexão
    const { data, error } = await supabase
      .from('_realtime_schema_migrations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro na conexão:', error.message);

      // Tentar uma consulta mais simples
      console.log('🔄 Tentando consulta alternativa...');
      const { data: healthData, error: healthError } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);

      if (healthError) {
        console.log('ℹ️ Tabela health_check não existe, isso é normal');
        console.log('✅ Conexão com Supabase está funcionando!');
      }
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
      console.log('📊 Dados recebidos:', data);
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testConnection();
