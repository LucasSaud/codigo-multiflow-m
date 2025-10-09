import EmailConfig from "../../models/EmailConfig";

const ShowEmailConfigService = async (companyId: number): Promise<EmailConfig | null> => {
  const emailConfig = await EmailConfig.findOne({
    where: {
      companyId,
      isActive: true
    }
  });

  return emailConfig;
};

export default ShowEmailConfigService;
