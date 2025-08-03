import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Defina sua senha - Sistema de Tickets',
    html: `
      <p>Olá ${name},</p>
      <p>Uma conta foi criada automaticamente para você no Sistema de Tickets.</p>
      <a href="${resetUrl}">Definir senha</a>
      <p>Este link expira em 1 hora.</p>
    `,
  });
}
