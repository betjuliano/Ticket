#!/usr/bin/env node

const { SYSTEM_USERS } = require('../config/users.ts');

console.log('📋 Usuários configurados:');
console.log('');

SYSTEM_USERS.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Matrícula: ${user.matricula || 'N/A'}`);
  console.log('');
}); 