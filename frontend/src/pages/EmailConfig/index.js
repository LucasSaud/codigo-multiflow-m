import React, { useState, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  CircularProgress,
  Chip
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import { Check, Error as ErrorIcon, Send } from "@material-ui/icons";
import api from "../../services/api";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    height: "100%",
    overflow: "auto",
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  header: {
    marginBottom: theme.spacing(3)
  },
  section: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  testSection: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius
  },
  buttonGroup: {
    marginTop: theme.spacing(3),
    display: "flex",
    gap: theme.spacing(2)
  },
  verifiedChip: {
    marginLeft: theme.spacing(2)
  }
}));

const EmailConfig = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [config, setConfig] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    isActive: false,
    isVerified: false
  });

  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/email-config");
      if (data) {
        setConfig({
          ...data,
          smtpPassword: "" // Não preencher senha por segurança
        });
      }
    } catch (err) {
      console.log("Nenhuma configuração encontrada");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações básicas
    if (!config.smtpHost) {
      toast.error("Host SMTP é obrigatório");
      return;
    }
    if (!config.smtpUser) {
      toast.error("Usuário SMTP é obrigatório");
      return;
    }
    if (!config.smtpPassword && !config.id) {
      toast.error("Senha SMTP é obrigatória");
      return;
    }
    if (!config.fromEmail) {
      toast.error("Email do remetente é obrigatório");
      return;
    }

    setLoading(true);
    try {
      if (config.id) {
        const updateData = { ...config };
        // Se a senha estiver vazia, não enviar
        if (!updateData.smtpPassword) {
          delete updateData.smtpPassword;
        }

        const { data } = await api.put(`/email-config/${config.id}`, updateData);
        setConfig({
          ...data,
          smtpPassword: "" // Não preencher senha
        });
        toast.success("Configuração atualizada com sucesso!");
      } else {
        const { data } = await api.post("/email-config", config);
        setConfig({
          ...data,
          smtpPassword: ""
        });
        toast.success("Configuração criada com sucesso!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao salvar configuração");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error("Digite um email para teste");
      return;
    }

    if (!config.id) {
      toast.error("Salve a configuração antes de testar");
      return;
    }

    setTestLoading(true);
    try {
      const { data } = await api.post(`/email-config/${config.id}/test`, {
        testEmail
      });

      toast.success(data.message || "Email de teste enviado! Verifique sua caixa de entrada.");

      // Recarregar config para atualizar status de verificação
      loadConfig();
    } catch (err) {
      toast.error(err.response?.data?.error || "Falha ao enviar email de teste");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <MainHeader>
        <Title>Configuração de Email SMTP</Title>
      </MainHeader>

      <Paper className={classes.paper}>
        <Box className={classes.header}>
          <Typography variant="h6" gutterBottom>
            Configurações do Servidor SMTP
            {config.isVerified && (
              <Chip
                icon={<Check />}
                label="Verificado"
                color="primary"
                size="small"
                className={classes.verifiedChip}
              />
            )}
            {config.id && !config.isVerified && (
              <Chip
                icon={<ErrorIcon />}
                label="Não Verificado"
                color="secondary"
                size="small"
                className={classes.verifiedChip}
              />
            )}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Configure suas credenciais SMTP para envio de emails personalizados
          </Typography>
        </Box>

        {loading && !config.id ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Servidor SMTP */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Servidor
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                label="Host SMTP"
                fullWidth
                variant="outlined"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Porta"
                type="number"
                fullWidth
                variant="outlined"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.smtpSecure}
                    onChange={(e) => setConfig({ ...config, smtpSecure: e.target.checked })}
                    color="primary"
                  />
                }
                label="Usar SSL/TLS (recomendado para portas 465)"
              />
            </Grid>

            {/* Credenciais */}
            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom className={classes.section}>
                Credenciais de Autenticação
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Usuário SMTP (Email)"
                fullWidth
                variant="outlined"
                value={config.smtpUser}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="seu@email.com"
                type="email"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={config.id ? "Nova Senha SMTP (deixe vazio para manter)" : "Senha SMTP"}
                type="password"
                fullWidth
                variant="outlined"
                value={config.smtpPassword}
                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                placeholder="••••••••"
                required={!config.id}
              />
            </Grid>

            {/* Informações do Remetente */}
            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom className={classes.section}>
                Informações do Remetente
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Nome do Remetente"
                fullWidth
                variant="outlined"
                value={config.fromName}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                placeholder="Minha Empresa"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email do Remetente"
                fullWidth
                variant="outlined"
                value={config.fromEmail}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                placeholder="contato@minhaempresa.com"
                type="email"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email de Resposta (Reply-To)"
                fullWidth
                variant="outlined"
                value={config.replyTo}
                onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
                placeholder="respostas@minhaempresa.com"
                type="email"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <Divider />
              <Box className={classes.section}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.isActive}
                      onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Ativar esta configuração (emails serão enviados usando estas credenciais)"
                />
              </Box>
            </Grid>

            {/* Botões de Ação */}
            <Grid item xs={12}>
              <Box className={classes.buttonGroup}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Salvar Configuração"}
                </Button>

                {config.id && (
                  <Button variant="outlined" onClick={loadConfig}>
                    Cancelar
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Seção de Teste */}
      {config.id && (
        <Paper className={classes.paper}>
          <Box className={classes.testSection}>
            <Typography variant="h6" gutterBottom>
              Testar Configuração
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Envie um email de teste para validar suas credenciais SMTP
            </Typography>

            <Grid container spacing={2} style={{ marginTop: 16 }}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Email para Teste"
                  fullWidth
                  variant="outlined"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="teste@email.com"
                  type="email"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={handleTest}
                  disabled={testLoading || !config.id}
                  startIcon={<Send />}
                  style={{ height: "100%" }}
                >
                  {testLoading ? <CircularProgress size={24} /> : "Enviar Teste"}
                </Button>
              </Grid>

              {config.lastTestAt && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Último teste: {new Date(config.lastTestAt).toLocaleString("pt-BR")}
                  </Typography>
                </Grid>
              )}

              {config.lastTestError && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">
                    Último erro: {config.lastTestError}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      )}
    </MainContainer>
  );
};

export default EmailConfig;
