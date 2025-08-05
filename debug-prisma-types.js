#!/usr/bin/env node

/**
 * Script para verificar tipos do Prisma vs tipos locais
 */

const fs = require('fs');

console.log('🔍 VERIFICANDO TIPOS DO PRISMA...\n');

// 1. Verificar schema do Prisma
console.log('📋 SCHEMA PRISMA:');
try {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  
  // Extrair modelo DocsArticle
  const docsArticleMatch = schema.match(/model DocsArticle \{([\s\S]*?)\}/);
  if (docsArticleMatch) {
    console.log('✅ Modelo DocsArticle encontrado');
    console.log('Campos:');
    const fields = docsArticleMatch[1].split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//'))
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('@@'));
    
    fields.forEach(field => {
      if (field) console.log(`   - ${field}`);
    });
  } else {
    console.log('❌ Modelo DocsArticle não encontrado');
  }
  
  // Extrair modelo Notification
  const notificationMatch = schema.match(/model Notification \{([\s\S]*?)\}/);
  if (notificationMatch) {
    console.log('\n✅ Modelo Notification encontrado');
    console.log('Campos:');
    const fields = notificationMatch[1].split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//'))
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('@@'));
    
    fields.forEach(field => {
      if (field) console.log(`   - ${field}`);
    });
  } else {
    console.log('❌ Modelo Notification não encontrado');
  }
  
} catch (error) {
  console.log('❌ Erro ao ler schema.prisma:', error.message);
}

// 2. Verificar tipos locais
console.log('\n📋 TIPOS LOCAIS:');
try {
  const knowledgeBase = fs.readFileSync('components/knowledge/KnowledgeBase.tsx', 'utf8');
  
  // Extrair interface KnowledgeArticle
  const knowledgeArticleMatch = knowledgeBase.match(/interface KnowledgeArticle \{([\s\S]*?)\}/);
  if (knowledgeArticleMatch) {
    console.log('✅ Interface KnowledgeArticle encontrada');
    console.log('Campos:');
    const fields = knowledgeArticleMatch[1].split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//'))
      .map(line => line.trim())
      .filter(line => line && line.includes(':'));
    
    fields.forEach(field => {
      if (field) console.log(`   - ${field}`);
    });
  } else {
    console.log('❌ Interface KnowledgeArticle não encontrada');
  }
  
} catch (error) {
  console.log('❌ Erro ao ler KnowledgeBase.tsx:', error.message);
}

// 3. Comparar tipos
console.log('\n🔍 COMPARAÇÃO DE TIPOS:');
console.log('Problema identificado:');
console.log('- KnowledgeBase usa interface KnowledgeArticle (local)');
console.log('- Mas recebe dados do tipo Article (Prisma)');
console.log('- Isso causa conflito de tipos e resulta em "never"');

console.log('\n💡 SOLUÇÃO RECOMENDADA:');
console.log('1. Criar função de adaptação:');
console.log('   function adaptArticleToKnowledge(article: Article): KnowledgeArticle');
console.log('2. Ou usar type assertion:');
console.log('   setSelectedArticle(data.data as KnowledgeArticle)');
console.log('3. Ou unificar os tipos');

console.log('\n🔍 VERIFICAÇÃO CONCLUÍDA!'); 