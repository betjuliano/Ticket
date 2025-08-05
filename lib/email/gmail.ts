import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const auth = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Configurar credenciais
auth.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN || null,
});

export class GmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const accessToken = await auth.getAccessToken();
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken.token || undefined,
        },
      });

      console.log('✅ Gmail transporter inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Gmail transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    if (!this.transporter) {
      throw new Error('Gmail transporter não inicializado');
    }

    const senderEmail = process.env.GMAIL_USER || 'noreply@ufsm.edu.br';
    const fromName = options.from?.split('<')[0]?.trim() || 'Sistema de Tickets UFSM';

    const mailOptions = {
      from: `"${fromName}" <${senderEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  async sendTicketNotification(
    to: string,
    ticketId: string,
    ticketTitle: string,
    action: string
  ) {
    const subject = `Ticket #${ticketId} - ${action}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Sistema de Tickets UFSM</h2>
        <h3>${action}</h3>
        <p><strong>Ticket:</strong> #${ticketId}</p>
        <p><strong>Título:</strong> ${ticketTitle}</p>
        <p>Acesse o sistema para mais detalhes.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Esta é uma notificação automática do Sistema de Tickets UFSM.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordReset(to: string, resetToken: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    const subject = 'Redefinição de Senha - Sistema de Tickets UFSM';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Redefinição de Senha</h2>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Redefinir Senha
        </a>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Sistema de Tickets UFSM
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

export default new GmailService();
