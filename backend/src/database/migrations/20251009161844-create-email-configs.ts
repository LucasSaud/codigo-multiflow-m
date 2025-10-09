import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("EmailConfigs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      smtpHost: {
        type: DataTypes.STRING,
        allowNull: false
      },
      smtpPort: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 587
      },
      smtpSecure: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      smtpUser: {
        type: DataTypes.STRING,
        allowNull: false
      },
      smtpPassword: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      fromName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fromEmail: {
        type: DataTypes.STRING,
        allowNull: false
      },
      replyTo: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastTestAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastTestError: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Índice para busca por companyId
    await queryInterface.addIndex("EmailConfigs", ["companyId"], {
      name: "email_configs_company_id_idx"
    });

    // Índice para busca de config ativa
    await queryInterface.addIndex("EmailConfigs", ["companyId", "isActive"], {
      name: "email_configs_company_active_idx"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("EmailConfigs");
  }
};
