import { Interaction, ChatInputCommandInteraction } from "discord.js";

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;
  const i = interaction as ChatInputCommandInteraction;

  switch (i.commandName) {
    case "ajuda":
      await i.reply({ content: "Use `lajuda` para ver todos os comandos.", ephemeral: true });
      break;
    case "saldo":
      await i.reply({ content: "Use `lsaldo` para ver sua carteira.", ephemeral: true });
      break;
    case "perfil":
      await i.reply({ content: "Use `lperfil` para ver seu perfil.", ephemeral: true });
      break;
    case "ranking":
      await i.reply({ content: "Use `lranking` para ver o top 10.", ephemeral: true });
      break;
    default:
      await i.reply({ content: "Comando não reconhecido.", ephemeral: true });
  }
}
