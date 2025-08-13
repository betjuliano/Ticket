import { PrismaClient } from '@prisma/client';
import { SYSTEM_USERS, prepareUsersForDatabase, validateUserConfig } from '../config/users';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Validar configuração de usuários
    const validationErrors = validateUserConfig(SYSTEM_USERS);
    if (validationErrors.length > 0) {
      console.error('❌ Configuração de usuários inválida:', validationErrors);
      return;
    }

    // Preparar usuários para inserção
    const usersToInsert = await prepareUsersForDatabase(SYSTEM_USERS);

    // Inserir usuários no banco
    for (const user of usersToInsert) {
      const userData = {
        email: user.email,
        name: user.name,
        password: await bcrypt.hash(user.password, 10),
        role: user.role,
        matricula: user.matricula || null,
        telefone: user.telefone || null,
      };

      const createdUser = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });

      console.log(`✅ Usuário ${createdUser.name} (${createdUser.email}) processado`);
    }

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
