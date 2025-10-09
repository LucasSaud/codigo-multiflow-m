import nodemailer from "nodemailer";
import AppError from "../../errors/AppError";
import EmailConfig from "../../models/EmailConfig";
import { decrypt } from "../../utils/encryption";
import logger from "../../utils/logger";

interface Request {
  emailConfigId: number;
  companyId: number;
  testEmail: string;
}

const TestEmailConfigService = async ({ emailConfigId, companyId, testEmail }: Request) => {
  const emailConfig = await EmailConfig.findOne({
    where: {
      id: emailConfigId,
      companyId
    }
  });

  if (!emailConfig) {
    throw new AppError("Configuração de email não encontrada", 404);
  }

  try {
    logger.info(`[TestEmailConfig] Testing SMTP config ${emailConfigId} for company ${companyId}`);

    const decryptedPassword = decrypt(emailConfig.smtpPassword);

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: decryptedPassword
      }
    });

    // Verificar conexão
    await transporter.verify();

    // Enviar email de teste
    const info = await transporter.sendMail({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: testEmail,
      subject: "✅ Teste de Configuração SMTP - Multiflow",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Teste de Configuração SMTP</h1>
            </div>
            <div class="content">
              <div class="success">
                <h3>✅ Configuração Validada com Sucesso!</h3>
                <p>Se você recebeu este email, sua configuração SMTP está funcionando corretamente!</p>
              </div>

              <div class="info">
                <h4>Informações da Configuração:</h4>
                <ul>
                  <li><strong>Servidor SMTP:</strong> ${emailConfig.smtpHost}</li>
                  <li><strong>Porta:</strong> ${emailConfig.smtpPort}</li>
                  <li><strong>Segurança:</strong> ${emailConfig.smtpSecure ? 'SSL/TLS' : 'Não'}</li>
                  <li><strong>Usuário:</strong> ${emailConfig.smtpUser}</li>
                  <li><strong>Nome Remetente:</strong> ${emailConfig.fromName}</li>
                  <li><strong>Email Remetente:</strong> ${emailConfig.fromEmail}</li>
                </ul>
              </div>

              <p>Sua configuração de email está pronta para ser usada no sistema Multiflow!</p>
              <p>Todos os emails transacionais serão enviados usando estas credenciais.</p>
            </div>
            <div class="footer">
              <p>Multiflow - Sistema de Automação WhatsApp Business</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Atualizar status
    await emailConfig.update({
      isVerified: true,
      lastTestAt: new Date(),
      lastTestError: null
    });

    logger.info(`[TestEmailConfig] Test email sent successfully. MessageId: ${info.messageId}`);

    return {
      success: true,
      message: "Email de teste enviado com sucesso!",
      messageId: info.messageId
    };
  } catch (error: any) {
    logger.error(`[TestEmailConfig] Failed to send test email:`, error);

    // Salvar erro
    await emailConfig.update({
      isVerified: false,
      lastTestAt: new Date(),
      lastTestError: error.message || "Erro desconhecido"
    });

    throw new AppError(`Falha ao enviar email de teste: ${error.message}`, 400);
  }
};

export default TestEmailConfigService;
