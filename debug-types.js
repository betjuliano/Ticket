#!/usr/bin/env node

/**
 * Script de Depuração de Tipos TypeScript
 * Analisa automaticamente os problemas de tipos no projeto
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO DEPURAÇÃO DE TIPOS...\n');

// 1. Verificar configuração TypeScript
console.log('📋 CONFIGURAÇÃO TYPESCRIPT:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json encontrado');
  console.log('   - exactOptionalPropertyTypes:', tsConfig.compilerOptions.exactOptionalPropertyTypes);
  console.log('   - strict:', tsConfig.compilerOptions.strict);
  console.log('   - noImplicitAny:', tsConfig.compilerOptions.noImplicitAny);
} catch (error) {
  console.log('❌ Erro ao ler tsconfig.json:', error.message);
}

// 2. Verificar arquivos com problemas
console.log('\n📁 ARQUIVOS COM PROBLEMAS:');
const problemFiles = [
  'components/knowledge/KnowledgeBase.tsx',
  'components/ui/context-menu.tsx',
  'components/ui/dropdown-menu.tsx',
  'components/ui/menubar.tsx',
  'components/ui/use-toast.ts'
];

problemFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTE`);
  } else {
    console.log(`❌ ${file} - NÃO ENCONTRADO`);
  }
});

// 3. Verificar tipos do Prisma
console.log('\n🗄️ VERIFICANDO TIPOS DO PRISMA:');
try {
  const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const hasArticle = prismaSchema.includes('model DocsArticle');
  const hasNotification = prismaSchema.includes('model Notification');
  
  console.log('✅ Schema Prisma encontrado');
  console.log('   - DocsArticle model:', hasArticle ? 'EXISTE' : 'NÃO EXISTE');
  console.log('   - Notification model:', hasNotification ? 'EXISTE' : 'NÃO EXISTE');
} catch (error) {
  console.log('❌ Erro ao ler schema.prisma:', error.message);
}

// 4. Verificar dependências
console.log('\n📦 VERIFICANDO DEPENDÊNCIAS:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const typescriptVersion = packageJson.devDependencies?.typescript;
  const prismaVersion = packageJson.dependencies?.['@prisma/client'];
  
  console.log('✅ package.json encontrado');
  console.log('   - TypeScript version:', typescriptVersion);
  console.log('   - Prisma Client version:', prismaVersion);
} catch (error) {
  console.log('❌ Erro ao ler package.json:', error.message);
}

// 5. Sugestões de correção
console.log('\n💡 SUGESTÕES DE CORREÇÃO:');
console.log('1. Para KnowledgeBase.tsx:');
console.log('   - Verificar se Article (Prisma) é compatível com KnowledgeArticle');
console.log('   - Adicionar type assertion: (data.data as KnowledgeArticle)');
console.log('   - Ou criar interface de adaptação');

console.log('\n2. Para Componentes UI:');
console.log('   - Desabilitar exactOptionalPropertyTypes temporariamente');
console.log('   - Ou adicionar verificações explícitas: checked={checked ?? false}');
console.log('   - Ou usar type assertions quando necessário');

console.log('\n3. Para Configuração TypeScript:');
console.log('   - Considerar relaxar exactOptionalPropertyTypes');
console.log('   - Ou adicionar exceções específicas');

console.log('\n🔍 DEPURAÇÃO CONCLUÍDA!');
console.log('Execute "npm run type-check" para ver os erros atuais.'); 