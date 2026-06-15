import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY, authorFooter } from "../util.js";
import { getQueue } from "./queue.js";

export default async function fila(message: Message): Promise<void> {
  const q = getQueue(message.guild!.id);

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle("🎵 Fila de músicas")
    .setAuthor(authorFooter(message))
    .setTimestamp();

  if (!q.length) {
    embed.setDescription("📭 A fila está vazia. Use `lplay <música>` para adicionar.");
  } else {
    const lines = q.map((t, i) => `**${i + 1}.** ${t.title} — pedido por *${t.requestedBy}*`);
    embed.setDescription(lines.slice(0, 20).join("\n") + (q.length > 20 ? `\n...e mais ${q.length - 20} músicas` : ""));
  }

  await message.reply({ embeds: [embed] });
}
