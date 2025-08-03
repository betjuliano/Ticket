import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { findOrCreateUser } from '@/services/user';

const gmail = google.gmail({ version: 'v1' });

export async function processIncomingEmails() {
  try {
    // Configurar autenticação OAuth2
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    auth.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // Buscar emails não lidos
    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      q: 'is:unread to:suporte@seudominio.com',
    });

    const messages = response.data.messages || [];

    for (const message of messages) {
      if (message.id) {
        await processEmailMessage(auth, message.id);
      }
    }
  } catch (error) {
    console.error('Erro ao processar emails:', error);
  }
}

async function processEmailMessage(auth: any, messageId: string) {
  try {
    const message = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId,
    });

    const headers = message.data.payload?.headers || [];
    const subject =
      headers.find(h => h.name === 'Subject')?.value || 'Sem assunto';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const emailMatch = from.match(/<(.+)>/) || [null, from];
    const senderEmail = emailMatch[1];

    // Extrair corpo do email
    let body = '';
    if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString();
    }

    const user = await findOrCreateUser(
      senderEmail,
      from.split('<')[0].trim() || senderEmail
    );

    // Criar ticket automaticamente
    const ticket = await prisma.ticket.create({
      data: {
        title: subject,
        description: body,
        category: 'Email',
        tags: 'email,automatico',
        createdById: user.id,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
    });

    // Marcar email como lido
    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    console.log(`✅ Ticket criado automaticamente: ${ticket.id}`);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}
