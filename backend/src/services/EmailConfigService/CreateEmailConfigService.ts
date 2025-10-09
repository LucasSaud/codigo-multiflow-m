import * as Yup from "yup";
import AppError from "../../errors/AppError";
import EmailConfig from "../../models/EmailConfig";
import { encrypt } from "../../utils/encryption";

interface Request {
  companyId: number;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isActive?: boolean;
}

const CreateEmailConfigService = async (data: Request): Promise<EmailConfig> => {
  const schema = Yup.object().shape({
    smtpHost: Yup.string().required("Host SMTP é obrigatório"),
    smtpPort: Yup.number().required("Porta SMTP é obrigatória").min(1).max(65535),
    smtpUser: Yup.string().email("Email inválido").required("Usuário SMTP é obrigatório"),
    smtpPassword: Yup.string().required("Senha SMTP é obrigatória").min(1),
    fromName: Yup.string().required("Nome do remetente é obrigatório"),
    fromEmail: Yup.string().email("Email inválido").required("Email do remetente é obrigatório")
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  // Verificar se já existe config ativa para essa empresa
  if (data.isActive) {
    await EmailConfig.update(
      { isActive: false },
      { where: { companyId: data.companyId } }
    );
  }

  // Criptografar senha
  const encryptedPassword = encrypt(data.smtpPassword);

  const emailConfig = await EmailConfig.create({
    companyId: data.companyId,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    smtpSecure: data.smtpSecure !== false, // default true
    smtpUser: data.smtpUser,
    smtpPassword: encryptedPassword,
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    replyTo: data.replyTo || data.fromEmail,
    isActive: data.isActive || false
  });

  return emailConfig;
};

export default CreateEmailConfigService;
