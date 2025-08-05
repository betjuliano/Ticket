import bcrypt from 'bcryptjs';

export interface UserConfig {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER';
  matricula?: string;
  telefone?: string;
  isActive?: boolean;
}

// Configuração dos usuários do sistema
export const SYSTEM_USERS: UserConfig[] = [
  {
    email: 'admjulianoo@gmail.com',
    name: 'Juliano Admin',
    password: 'Adm4125',
    role: 'ADMIN',
    matricula: 'ADM001',
    isActive: true,
  },
  {
    email: 'coordadm@ufsm.br',
    name: 'Coordenação UFSM',
    password: 'Adm4125',
    role: 'MANAGER',
    matricula: 'COORD001',
    telefone: '(55) 3220-8000',
    isActive: true,
  },
  {
    email: 'alunoadm@ufsm.br',
    name: 'Aluno Admin UFSM',
    password: 'teste123',
    role: 'USER',
    matricula: 'ALUNO001',
    isActive: true,
  },
];

// Função para preparar usuários para inserção no banco
export async function prepareUsersForDatabase(users: UserConfig[]) {
  return Promise.all(
    users.map(async (user) => ({
      email: user.email,
      name: user.name,
      password: await bcrypt.hash(user.password, 12),
      role: user.role,
      matricula: user.matricula,
      telefone: user.telefone,
      isActive: user.isActive ?? true,
    }))
  );
}

// Função para validar configuração de usuários
export function validateUserConfig(users: UserConfig[]): string[] {
  const errors: string[] = [];
  const emails = new Set<string>();

  users.forEach((user, index) => {
    // Verificar email único
    if (emails.has(user.email)) {
      errors.push(`Email duplicado: ${user.email}`);
    }
    emails.add(user.email);

    // Verificar email válido
    if (!user.email.includes('@')) {
      errors.push(`Email inválido: ${user.email}`);
    }

    // Verificar senha mínima
    if (user.password.length < 6) {
      errors.push(`Senha muito curta para ${user.email}`);
    }

    // Verificar nome
    if (!user.name.trim()) {
      errors.push(`Nome inválido para ${user.email}`);
    }

    // Verificar role válida
    const validRoles = ['ADMIN', 'MANAGER', 'AGENT', 'USER'];
    if (!validRoles.includes(user.role)) {
      errors.push(`Role inválida para ${user.email}: ${user.role}`);
    }
  });

  return errors;
}

// Função para adicionar novo usuário dinamicamente
export function addUserToConfig(newUser: UserConfig) {
  // Verificar se o usuário já existe
  const existingUser = SYSTEM_USERS.find(user => user.email === newUser.email);
  if (existingUser) {
    throw new Error(`Usuário com email ${newUser.email} já existe na configuração`);
  }

  // Validar o novo usuário
  const errors = validateUserConfig([newUser]);
  if (errors.length > 0) {
    throw new Error(`Erro na validação: ${errors.join(', ')}`);
  }

  // Adicionar à configuração
  SYSTEM_USERS.push(newUser);
  
  console.log(`✅ Usuário ${newUser.name} (${newUser.email}) adicionado à configuração`);
  return newUser;
}

// Função para remover usuário da configuração
export function removeUserFromConfig(email: string) {
  const index = SYSTEM_USERS.findIndex(user => user.email === email);
  if (index === -1) {
    throw new Error(`Usuário com email ${email} não encontrado na configuração`);
  }

  const removedUser = SYSTEM_USERS.splice(index, 1)[0];
  console.log(`✅ Usuário ${removedUser?.name || 'N/A'} (${removedUser?.email || 'N/A'}) removido da configuração`);
  return removedUser;
}

// Função para listar todos os usuários configurados
export function listConfiguredUsers() {
  return SYSTEM_USERS.map(user => ({
    email: user.email,
    name: user.name,
    role: user.role,
    matricula: user.matricula,
    isActive: user.isActive,
  }));
} 