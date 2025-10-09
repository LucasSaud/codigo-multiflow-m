import express from "express";
import isAuth from "../middleware/isAuth";

import CreateEmailConfigService from "../services/EmailConfigService/CreateEmailConfigService";
import UpdateEmailConfigService from "../services/EmailConfigService/UpdateEmailConfigService";
import ShowEmailConfigService from "../services/EmailConfigService/ShowEmailConfigService";
import ListEmailConfigsService from "../services/EmailConfigService/ListEmailConfigsService";
import DeleteEmailConfigService from "../services/EmailConfigService/DeleteEmailConfigService";
import TestEmailConfigService from "../services/EmailConfigService/TestEmailConfigService";

const emailConfigRoutes = express.Router();

// Criar configuração
emailConfigRoutes.post("/email-config", isAuth, async (req, res) => {
  try {
    const { companyId } = req.user;

    const emailConfig = await CreateEmailConfigService({
      companyId,
      ...req.body
    });

    // Remover senha antes de retornar
    const response: any = emailConfig.toJSON();
    delete response.smtpPassword;

    return res.status(201).json(response);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Buscar configuração ativa da empresa
emailConfigRoutes.get("/email-config", isAuth, async (req, res) => {
  try {
    const { companyId } = req.user;

    const emailConfig = await ShowEmailConfigService(companyId);

    if (!emailConfig) {
      return res.json(null);
    }

    // Remover senha antes de retornar
    const response: any = emailConfig.toJSON();
    delete response.smtpPassword;

    return res.json(response);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Listar todas as configurações da empresa
emailConfigRoutes.get("/email-configs", isAuth, async (req, res) => {
  try {
    const { companyId } = req.user;

    const emailConfigs = await ListEmailConfigsService(companyId);

    // Remover senhas antes de retornar
    const response = emailConfigs.map(config => {
      const obj: any = config.toJSON();
      delete obj.smtpPassword;
      return obj;
    });

    return res.json(response);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Atualizar configuração
emailConfigRoutes.put("/email-config/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const emailConfig = await UpdateEmailConfigService({
      id: parseInt(id),
      companyId,
      ...req.body
    });

    // Remover senha antes de retornar
    const response: any = emailConfig.toJSON();
    delete response.smtpPassword;

    return res.json(response);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Deletar configuração
emailConfigRoutes.delete("/email-config/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    await DeleteEmailConfigService(parseInt(id), companyId);

    return res.json({ message: "Configuração removida com sucesso" });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Testar configuração
emailConfigRoutes.post("/email-config/:id/test", isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: "Email para teste é obrigatório" });
    }

    const result = await TestEmailConfigService({
      emailConfigId: parseInt(id),
      companyId,
      testEmail
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default emailConfigRoutes;
