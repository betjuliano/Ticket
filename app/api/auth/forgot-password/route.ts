import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configure seu provedor de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Enviar email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Recuperação de Senha - Curso Administração UFSM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Recuperação de Senha</h2>
          <p>Olá ${user.name},</p>
          <p>Você solicitou a recuperação de sua senha. Clique no link abaixo para criar uma nova senha:</p>
          <a href="${resetUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Redefinir Senha</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
          <hr style="margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">© 2024 Universidade Federal de Santa Maria</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Email de recuperação enviado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
