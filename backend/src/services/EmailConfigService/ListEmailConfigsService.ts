import EmailConfig from "../../models/EmailConfig";

const ListEmailConfigsService = async (companyId: number): Promise<EmailConfig[]> => {
  const emailConfigs = await EmailConfig.findAll({
    where: { companyId },
    order: [["isActive", "DESC"], ["createdAt", "DESC"]]
  });

  return emailConfigs;
};

export default ListEmailConfigsService;
