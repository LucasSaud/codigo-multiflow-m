import * as Yup from "yup";
import AppError from "../../errors/AppError";
import EmailConfig from "../../models/EmailConfig";
import { encrypt } from "../../utils/encryption";

interface Request {
  id: number;
  companyId: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  isActive?: boolean;
}

const UpdateEmailConfigService = async (data: Request): Promise<EmailConfig> => {
  const emailConfig = await EmailConfig.findOne({
    where: {
      id: data.id,
      companyId: data.companyId
    }
  });

  if (!emailConfig) {
    throw new AppError("Configuração de email não encontrada", 404);
  }

  const schema = Yup.object().shape({
    smtpHost: Yup.string(),
    smtpPort: Yup.number().min(1).max(65535),
    smtpUser: Yup.string().email("Email inválido"),
    fromName: Yup.string(),
    fromEmail: Yup.string().email("Email inválido")
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  // Se está ativando esta config, desativar outras da mesma empresa
  if (data.isActive === true) {
    await EmailConfig.update(
      { isActive: false },
      {
        where: {
          companyId: data.companyId,
          id: { [require('sequelize').Op.ne]: data.id }
        }
      }
    );
  }

  const updateData: any = {};

  if (data.smtpHost) updateData.smtpHost = data.smtpHost;
  if (data.smtpPort) updateData.smtpPort = data.smtpPort;
  if (data.smtpSecure !== undefined) updateData.smtpSecure = data.smtpSecure;
  if (data.smtpUser) updateData.smtpUser = data.smtpUser;
  if (data.fromName) updateData.fromName = data.fromName;
  if (data.fromEmail) updateData.fromEmail = data.fromEmail;
  if (data.replyTo !== undefined) updateData.replyTo = data.replyTo;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Se a senha foi alterada, criptografar
  if (data.smtpPassword) {
    updateData.smtpPassword = encrypt(data.smtpPassword);
  }

  await emailConfig.update(updateData);

  return emailConfig;
};

export default UpdateEmailConfigService;
