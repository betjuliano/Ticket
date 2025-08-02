import { gmail_v1, google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const gmail = google.gmail({ version: 'v1' })

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function processIncomingEmails() {
  try {
    // Configurar autenticação OAuth2
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    )

    auth.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    })

    // Buscar emails não lidos
    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      q: 'is:unread to:suporte@seudominio.com'
    })

    const messages = response.data.messages || []

    for (const message of messages) {
      if (message.id) {
        await processEmailMessage(auth, message.id)
      }
    }
  } catch (error) {
    console.error('Erro ao processar emails:', error)
  }
}

async function processEmailMessage(auth: any, messageId: string) {
  try {
    const message = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId
    })

    const headers = message.data.payload?.headers || []
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sem assunto'
    const from = headers.find(h => h.name === 'From')?.value || ''
    const emailMatch = from.match(/<(.+)>/) || [null, from]
    const senderEmail = emailMatch[1]

    // Extrair corpo do email
    let body = ''
    if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString()
    }

    // Verificar se o usuário existe
    let user = await prisma.user.findUnique({
      where: { email: senderEmail }
    })

    // Se não existir, criar usuário com senha aleatória e token de redefinição
    if (!user) {
      const tempPassword = crypto.randomUUID()
      const hashedPassword = await bcrypt.hash(tempPassword, 10)
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

      user = await prisma.user.create({
        data: {
          email: senderEmail,
          name: from.split('<')[0].trim() || senderEmail,
          password: hashedPassword,
          role: 'USER',
          resetToken,
          resetTokenExpiry,
        },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: senderEmail,
        subject: 'Defina sua senha - Sistema de Tickets',
        html: `
          <p>Olá ${user.name},</p>
          <p>Uma conta foi criada automaticamente para você no Sistema de Tickets.</p>
          <p>Clique no link abaixo para definir sua senha:</p>
          <a href="${resetUrl}">Definir senha</a>
          <p>Este link expira em 1 hora.</p>
        `,
      })
    }

    // Criar ticket automaticamente
    const ticket = await prisma.ticket.create({
      data: {
        title: subject,
        description: body,
        category: 'Email',
        tags: 'email,automatico',
        createdById: user.id,
        status: 'OPEN',
        priority: 'MEDIUM'
      }
    })

    // Marcar email como lido
    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    })

    console.log(`✅ Ticket criado automaticamente: ${ticket.id}`)
  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
  }
}