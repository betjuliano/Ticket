const API_BASE = 'http://localhost:3000/api'

// Função para fazer requisições
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
  
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  return response.json()
}

// Testes das APIs
async function testAPIs() {
  console.log('🧪 Testando todas as APIs...')
  
  try {
    // 1. Testar Health Check
    console.log('\n1. Health Check:')
    const health = await makeRequest('GET', '/health')
    console.log(health)
    
    // 2. Testar Tickets
    console.log('\n2. Tickets API:')
    const tickets = await makeRequest('GET', '/tickets')
    console.log('GET /tickets:', tickets)
    
    // 3. Testar Users
    console.log('\n3. Users API:')
    const users = await makeRequest('GET', '/users')
    console.log('GET /users:', users)
    
    // 4. Testar Knowledge
    console.log('\n4. Knowledge API:')
    const knowledge = await makeRequest('GET', '/knowledge')
    console.log('GET /knowledge:', knowledge)
    
    // 5. Testar Comments
    console.log('\n5. Comments API:')
    const comments = await makeRequest('GET', '/comments?ticketId=test')
    console.log('GET /comments:', comments)
    
    // 6. Testar Attachments
    console.log('\n6. Attachments API:')
    const attachments = await makeRequest('GET', '/attachments')
    console.log('GET /attachments:', attachments)
    
    // 7. Testar Dashboard Stats
    console.log('\n7. Dashboard Stats:')
    const stats = await makeRequest('GET', '/dashboard/stats')
    console.log('GET /dashboard/stats:', stats)
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error)
  }
}

// Executar testes
testAPIs()


## ✅ Excelente! Servidor Funcionando - Análise dos Resultados dos Testes

Ótimo! O servidor está rodando e conseguimos testar todas as APIs. Vou analisar os resultados:

### 📊 Resultados dos Testes das APIs

| API | Status | Observações |
|-----|--------|-------------|
| ✅ **Health Check** | Funcionando | Servidor saudável, uptime 122s |
| ✅ **Dashboard Stats** | Funcionando | Dados mockados retornando corretamente |
| ⚠️ **Tickets** | Erro de validação | Parâmetros de query inválidos |
| ❌ **Users** | Acesso negado | Requer autenticação |
| ❌ **Knowledge** | Erro de BD | PostgreSQL não conectado |
| ❌ **Comments** | Não autenticado | Requer sessão |
| ❌ **Attachments** | Não autenticado | Requer sessão |

### 🔧 Problemas Identificados e Soluções

#### 1. **Tickets API - Erro de Validação**
```javascript
// Corrigir a chamada da API de tickets
const tickets = await makeRequest('GET', '/tickets?page=1&limit=10')
```