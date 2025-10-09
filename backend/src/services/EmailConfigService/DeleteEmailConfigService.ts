import AppError from "../../errors/AppError";
import EmailConfig from "../../models/EmailConfig";

const DeleteEmailConfigService = async (id: number, companyId: number): Promise<void> => {
  const emailConfig = await EmailConfig.findOne({
    where: {
      id,
      companyId
    }
  });

  if (!emailConfig) {
    throw new AppError("Configuração de email não encontrada", 404);
  }

  await emailConfig.destroy();
};

export default DeleteEmailConfigService;
