import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Sem SMTP_HOST configurado, em desenvolvimento o e-mail é só impresso no console
// (útil para pegar o link de recuperação de senha). Em produção, SMTP é obrigatório.
export async function sendMail(message: MailMessage): Promise<void> {
  const host = process.env.SMTP_HOST;

  if (!host) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST não configurado.");
    }
    console.log(`📧 [e-mail simulado] Para: ${message.to}\nAssunto: ${message.subject}\n${message.text}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "Acessa+ <nao-responder@localhost>",
    ...message,
  });
}
