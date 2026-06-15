import { EmbedBuilder, Message } from "discord.js";
import { COLOR_SUCCESS, COLOR_ERROR, authorFooter } from "../util.js";
import { skipTrack, getQueue } from "./queue.js";

export default async function skip(message: Message): Promise<void> {
  const guildId = message.guild!.id;
  const skipped = skipTrack(guildId);

  if (!skipped) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ A fila está vazia.")] });
    return;
  }

  const next = getQueue(guildId)[0];
  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setDescription(`⏭️ Pulou **${skipped.title}**${next ? `\n▶️ Próxima: **${next.title}**` : "\n📭 Fila encerrada."}`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
