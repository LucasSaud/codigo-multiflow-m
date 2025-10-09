import nodemailer from "nodemailer";
import EmailConfig from "../models/EmailConfig";
import logger from "../utils/logger";
import { decrypt } from "../utils/encryption";

export interface MailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  companyId?: number; // ID da empresa para buscar config específica
  from?: string;
  replyTo?: string;
}

export async function SendMail(mailData: MailData) {
  let smtpConfig: any;
  let fromAddress = mailData.from;
  let replyToAddress = mailData.replyTo;

  // 1. Tentar usar configuração da empresa
  if (mailData.companyId) {
    try {
      const emailConfig = await EmailConfig.findOne({
        where: {
          companyId: mailData.companyId,
          isActive: true
        }
      });

      if (emailConfig) {
        logger.info(`[SendMail] Using company-specific SMTP for companyId: ${mailData.companyId}`);

        // Descriptografar senha
        const decryptedPassword = decrypt(emailConfig.smtpPassword);

        smtpConfig = {
          host: emailConfig.smtpHost,
          port: emailConfig.smtpPort,
          secure: emailConfig.smtpSecure,
          auth: {
            user: emailConfig.smtpUser,
            pass: decryptedPassword
          }
        };

        // Configurar from
        fromAddress = `${emailConfig.fromName} <${emailConfig.fromEmail}>`;
        replyToAddress = emailConfig.replyTo || emailConfig.fromEmail;
      } else {
        logger.warn(`[SendMail] No active email config for companyId: ${mailData.companyId}, using global config`);
      }
    } catch (error) {
      logger.error(`[SendMail] Error loading email config for companyId: ${mailData.companyId}`, error);
    }
  }

  // 2. Fallback: usar configuração global do .env
  if (!smtpConfig) {
    logger.info(`[SendMail] Using global SMTP config from .env`);

    smtpConfig = {
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || "587"),
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    };

    fromAddress = fromAddress || process.env.MAIL_FROM;
  }

  // 3. Criar transporter e enviar
  const transporter = nodemailer.createTransport(smtpConfig);

  const info = await transporter.sendMail({
    from: fromAddress,
    to: mailData.to,
    subject: mailData.subject,
    text: mailData.text,
    html: mailData.html || mailData.text,
    replyTo: replyToAddress
  });

  logger.info(`[SendMail] Message sent: ${info.messageId} to ${mailData.to}`);

  // Preview URL apenas em desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[SendMail] Preview URL: ${previewUrl}`);
    }
  }

  return info;
}
