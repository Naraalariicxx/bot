import { SlashCommandBuilder } from "discord.js";

export const slashCommands = [
  new SlashCommandBuilder().setName("ajuda").setDescription("Mostra todos os comandos disponíveis"),
  new SlashCommandBuilder().setName("saldo").setDescription("Ver sua carteira de coins"),
  new SlashCommandBuilder().setName("perfil").setDescription("Ver perfil de um usuário"),
  new SlashCommandBuilder().setName("ranking").setDescription("Top 10 mais ricos"),
].map((cmd) => cmd.toJSON());
