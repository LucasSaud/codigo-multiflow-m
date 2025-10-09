import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Default
} from "sequelize-typescript";
import Company from "./Company";

@Table({
  tableName: "EmailConfigs"
})
export class EmailConfig extends Model<EmailConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  // Configurações SMTP
  @Column
  smtpHost: string;

  @Column
  smtpPort: number;

  @Default(true)
  @Column
  smtpSecure: boolean; // SSL/TLS

  @Column
  smtpUser: string;

  @Column(DataType.TEXT)
  smtpPassword: string; // Criptografado

  // Configurações de Email
  @Column
  fromName: string; // Nome exibido

  @Column
  fromEmail: string; // Email remetente

  @Column
  replyTo: string; // Email de resposta

  // Status
  @Default(false)
  @Column
  isActive: boolean; // Usar essa config ou fallback global

  @Default(false)
  @Column
  isVerified: boolean; // Email verificado via teste

  @Column
  lastTestAt: Date; // Última vez que testou

  @Column(DataType.TEXT)
  lastTestError: string; // Último erro de teste

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default EmailConfig;
