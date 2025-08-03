import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendResetEmail } from './mailer';

export async function findOrCreateUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const password = crypto.randomUUID();
    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600_000);

    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role: 'USER',
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
    await sendResetEmail(email, name, token);
  }
  return user;
}
