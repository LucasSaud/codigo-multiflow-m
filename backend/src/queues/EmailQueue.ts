import Bull from "bull";
import { SendMail } from "../helpers/SendMail";
import EmailLog, { EmailStatus } from "../models/EmailLog";
import logger from "../utils/logger";

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  from: string;
  fromName: string;
  replyTo?: string;
  templateId: number;
  webhookLinkId?: number;
  companyId: number;
  recipientName?: string;
  variables?: object;
  metadata?: object;
}

// Criar fila de emails
const emailQueue = new Bull("email-queue", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0")
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000
    }
  }
});

// Processar jobs de email
emailQueue.process("send-email", async (job: Bull.Job<EmailJobData>) => {
  const { data } = job;

  logger.info(`Processing email job ${job.id} to ${data.to}`);

  try {
    // Criar log inicial
    const emailLog = await EmailLog.create({
      templateId: data.templateId,
      webhookLinkId: data.webhookLinkId,
      companyId: data.companyId,
      recipientEmail: data.to,
      recipientName: data.recipientName,
      subject: data.subject,
      status: EmailStatus.PENDING,
      variables: data.variables,
      metadata: data.metadata
    });

    // Enviar email
    await SendMail({
      to: data.to,
      subject: data.subject,
      html: data.html,
      companyId: data.companyId // Passa companyId para usar config específica da empresa
    });

    // Atualizar log de sucesso
    await emailLog.update({
      status: EmailStatus.SENT,
      sentAt: new Date()
    });

    logger.info(`Email sent successfully to ${data.to}`);

    return {
      success: true,
      emailLogId: emailLog.id,
      sentAt: new Date()
    };

  } catch (error) {
    logger.error(`Error sending email to ${data.to}:`, error);

    // Registrar erro no log
    if (data.templateId && data.companyId) {
      await EmailLog.create({
        templateId: data.templateId,
        webhookLinkId: data.webhookLinkId,
        companyId: data.companyId,
        recipientEmail: data.to,
        recipientName: data.recipientName,
        subject: data.subject,
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage: error.message,
        variables: data.variables,
        metadata: data.metadata
      });
    }

    throw error;
  }
});

// Event listeners
emailQueue.on("completed", (job, result) => {
  logger.info(`Email job ${job.id} completed:`, result);
});

emailQueue.on("failed", (job, error) => {
  logger.error(`Email job ${job.id} failed:`, error);
});

emailQueue.on("stalled", (job) => {
  logger.warn(`Email job ${job.id} stalled`);
});

/**
 * Adiciona um email à fila com delay opcional
 */
export const addEmailToQueue = async (
  data: EmailJobData,
  delay?: number
): Promise<Bull.Job<EmailJobData>> => {
  const options: Bull.JobOptions = {};

  if (delay && delay > 0) {
    options.delay = delay;
    logger.info(`Email to ${data.to} scheduled with delay of ${delay}ms`);
  }

  const job = await emailQueue.add("send-email", data, options);

  logger.info(`Email job ${job.id} added to queue for ${data.to}`);

  return job;
};

/**
 * Calcula o delay baseado no tipo e valor
 */
export const calculateDelay = (
  value: number,
  type: "immediate" | "seconds" | "minutes" | "hours" | "days"
): number => {
  if (type === "immediate" || !value || value <= 0) {
    return 0;
  }

  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };

  return value * (multipliers[type] || 0);
};

/**
 * Obtém estatísticas da fila
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed
  };
};

/**
 * Limpa jobs antigos da fila
 */
export const cleanOldJobs = async (grace: number = 24 * 60 * 60 * 1000) => {
  await emailQueue.clean(grace, "completed");
  await emailQueue.clean(grace, "failed");
};

export { emailQueue };
export default emailQueue;