#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const POSTGRES_SCHEMA = 'prisma/schema.prisma';
const SQLITE_SCHEMA = 'prisma/schema-sqlite.prisma';
const BACKUP_SCHEMA = 'prisma/schema-backup.prisma';

function switchToSQLite() {
  console.log('🔄 Alternando para SQLite...');
  
  // Fazer backup do schema atual
  if (fs.existsSync(POSTGRES_SCHEMA)) {
    fs.copyFileSync(POSTGRES_SCHEMA, BACKUP_SCHEMA);
    console.log('✅ Backup do schema PostgreSQL criado');
  }
  
  // Copiar schema SQLite
  if (fs.existsSync(SQLITE_SCHEMA)) {
    fs.copyFileSync(SQLITE_SCHEMA, POSTGRES_SCHEMA);
    console.log('✅ Schema SQLite aplicado');
  } else {
    console.error('❌ Arquivo schema-sqlite.prisma não encontrado');
    process.exit(1);
  }
  
  console.log('🎯 Agora você pode executar: npm run db:migrate');
}

function switchToPostgreSQL() {
  console.log('🔄 Alternando para PostgreSQL...');
  
  // Restaurar schema PostgreSQL
  if (fs.existsSync(BACKUP_SCHEMA)) {
    fs.copyFileSync(BACKUP_SCHEMA, POSTGRES_SCHEMA);
    console.log('✅ Schema PostgreSQL restaurado');
  } else {
    console.error('❌ Backup do schema PostgreSQL não encontrado');
    console.log('💡 Execute primeiro: npm run db:sqlite');
    process.exit(1);
  }
  
  console.log('🎯 Agora você pode executar: npm run db:migrate');
}

function showStatus() {
  const currentSchema = fs.readFileSync(POSTGRES_SCHEMA, 'utf8');
  const isSQLite = currentSchema.includes('provider = "sqlite"');
  
  console.log('📊 Status atual:');
  console.log(`   Database: ${isSQLite ? 'SQLite' : 'PostgreSQL'}`);
  console.log(`   Schema: ${POSTGRES_SCHEMA}`);
  
  if (fs.existsSync(BACKUP_SCHEMA)) {
    console.log('   Backup: Disponível');
  } else {
    console.log('   Backup: Não disponível');
  }
}

// Processar argumentos
const command = process.argv[2];

switch (command) {
  case 'sqlite':
    switchToSQLite();
    break;
  case 'postgres':
    switchToPostgreSQL();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('📋 Uso: node scripts/switch-db.js [comando]');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  sqlite    - Alternar para SQLite (desenvolvimento rápido)');
    console.log('  postgres  - Alternar para PostgreSQL (produção)');
    console.log('  status    - Mostrar status atual');
    console.log('');
    console.log('Exemplos:');
    console.log('  node scripts/switch-db.js sqlite');
    console.log('  node scripts/switch-db.js postgres');
    console.log('  node scripts/switch-db.js status');
} 