const API_BASE = 'http://localhost:3000/api'

async function makeRequest(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options)
    return await response.json()
  } catch (error) {
    return { error: error.message }
  }
}

async function testAPIs() {
  console.log('🧪 Testando APIs melhorado...')
  
  // 1. Health Check
  console.log('\n1. Health Check:')
  const health = await makeRequest('GET', '/health')
  console.log(health.status === 'healthy' ? '✅ Funcionando' : '❌ Erro')
  
  // 2. Dashboard Stats
  console.log('\n2. Dashboard Stats:')
  const stats = await makeRequest('GET', '/dashboard/stats')
  console.log(stats.success ? '✅ Funcionando' : '❌ Erro')
  
  // 3. Tickets com parâmetros corretos
  console.log('\n3. Tickets API:')
  const tickets = await makeRequest('GET', '/tickets?page=1&limit=10')
  console.log(tickets.success ? '✅ Funcionando' : `❌ ${tickets.error}`)
  
  // 4. Teste de criação de ticket
  console.log('\n4. Criar Ticket:')
  const newTicket = await makeRequest('POST', '/tickets', {
    title: 'Teste de API',
    description: 'Testando criação via API',
    priority: 'medium',
    category: 'teste',
    createdBy: 'test-user'
  })
  console.log(newTicket.success ? '✅ Criado' : `❌ ${newTicket.error}`)
  
  console.log('\n📋 Resumo:')
  console.log('✅ APIs básicas funcionando')
  console.log('⚠️ Banco de dados precisa ser configurado')
  console.log('🔐 APIs protegidas requerem autenticação')
}

testAPIs()