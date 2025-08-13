#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para ler o arquivo de configuração
function readUserConfig() {
  const configPath = path.join(__dirname, '../config/users.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  return content;
}

// Função para extrair usuários do arquivo de configuração
function extractUsersFromConfig(content) {
  const usersMatch = content.match(/export const SYSTEM_USERS: UserConfig\[\] = \[([\s\S]*?)\];/);
  if (!usersMatch) {
    throw new Error('Não foi possível encontrar SYSTEM_USERS no arquivo de configuração');
  }

  const usersSection = usersMatch[1];
  const userMatches = usersSection.match(/\{[^}]+\}/g);
  
  if (!userMatches) {
    return [];
  }

  return userMatches.map(userStr => {
    const emailMatch = userStr.match(/email:\s*['"`]([^'"`]+)['"`]/);
    const nameMatch = userStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const roleMatch = userStr.match(/role:\s*['"`]([^'"`]+)['"`]/);
    const matriculaMatch = userStr.match(/matricula:\s*['"`]([^'"`]+)['"`]/);

    return {
      email: emailMatch ? emailMatch[1] : '',
      name: nameMatch ? nameMatch[1] : '',
      role: roleMatch ? roleMatch[1] : '',
      matricula: matriculaMatch ? matriculaMatch[1] : '',
    };
  }).filter(user => user.email && user.name && user.role); // Filtrar apenas usuários válidos
}

// Função para adicionar usuário à configuração
function addUserToConfig(email, name, role, password, matricula = '') {
  const configPath = path.join(__dirname, '../config/users.ts');
  let content = fs.readFileSync(configPath, 'utf8');

  // Verificar se o usuário já existe
  if (content.includes(`email: '${email}'`) || content.includes(`email: "${email}"`)) {
    throw new Error(`Usuário com email ${email} já existe na configuração`);
  }

  // Criar novo usuário
  const newUser = `  {
    email: '${email}',
    name: '${name}',
    password: '${password}',
    role: '${role.toUpperCase()}',
    matricula: '${matricula}',
    isActive: true,
  },`;

  // Encontrar a posição para inserir (antes do fechamento do array)
  const insertIndex = content.lastIndexOf('];');
  if (insertIndex === -1) {
    throw new Error('Não foi possível encontrar o final do array SYSTEM_USERS');
  }

  // Inserir o novo usuário
  const newContent = content.slice(0, insertIndex) + newUser + '\n' + content.slice(insertIndex);
  
  // Escrever de volta no arquivo
  fs.writeFileSync(configPath, newContent, 'utf8');
  
  console.log(`✅ Usuário ${name} (${email}) adicionado à configuração`);
}

// Função para remover usuário da configuração
function removeUserFromConfig(email) {
  const configPath = path.join(__dirname, '../config/users.ts');
  let content = fs.readFileSync(configPath, 'utf8');

  // Encontrar o bloco do usuário
  const userPattern = new RegExp(`\\s*{[^}]*email:\\s*['"\`]${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`][^}]*},?\\s*`, 'g');
  
  if (!userPattern.test(content)) {
    throw new Error(`Usuário com email ${email} não encontrado na configuração`);
  }

  // Remover o usuário
  const newContent = content.replace(userPattern, '');
  
  // Escrever de volta no arquivo
  fs.writeFileSync(configPath, newContent, 'utf8');
  
  console.log(`✅ Usuário ${email} removido da configuração`);
}

// Função para listar usuários
function listUsers() {
  const content = readUserConfig();
  const users = extractUsersFromConfig(content);
  
  console.log('📋 Usuários configurados:');
  console.log('');
  
  if (users.length === 0) {
    console.log('Nenhum usuário configurado.');
    return;
  }
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Matrícula: ${user.matricula || 'N/A'}`);
    console.log('');
  });
}

// Função para mostrar ajuda
function showHelp() {
  console.log('📋 Uso: node scripts/manage-users.js [comando] [opções]');
  console.log('');
  console.log('Comandos disponíveis:');
  console.log('  list                    - Listar todos os usuários configurados');
  console.log('  add <email> <name> <role> <password> [matricula]');
  console.log('                           - Adicionar novo usuário');
  console.log('  remove <email>          - Remover usuário por email');
  console.log('  help                     - Mostrar esta ajuda');
  console.log('');
  console.log('Exemplos:');
  console.log('  node scripts/manage-users.js list');
  console.log('  node scripts/manage-users.js add "joao@ufsm.br" "João Silva" "USER" "senha123" "123456"');
  console.log('  node scripts/manage-users.js remove "joao@ufsm.br"');
  console.log('');
  console.log('Roles disponíveis: ADMIN, MANAGER, AGENT, USER');
}

// Processar argumentos
const command = process.argv[2];

switch (command) {
  case 'list':
    listUsers();
    break;
    
  case 'add':
    const [, , , email, name, role, password, matricula] = process.argv;
    if (!email || !name || !role || !password) {
      console.error('❌ Parâmetros insuficientes para adicionar usuário');
      console.log('Uso: node scripts/manage-users.js add <email> <name> <role> <password> [matricula]');
      process.exit(1);
    }
    try {
      addUserToConfig(email, name, role, password, matricula);
    } catch (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
    break;
    
  case 'remove':
    const emailToRemove = process.argv[3];
    if (!emailToRemove) {
      console.error('❌ Email não fornecido');
      console.log('Uso: node scripts/manage-users.js remove <email>');
      process.exit(1);
    }
    try {
      removeUserFromConfig(emailToRemove);
    } catch (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
    break;
    
  case 'help':
  default:
    showHelp();
    break;
} 