import { EmbedBuilder, Message } from "discord.js";
import { COLOR_SUCCESS, authorFooter } from "../util.js";
import { clearQueue } from "./queue.js";

export default async function stop(message: Message): Promise<void> {
  clearQueue(message.guild!.id);

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setDescription("⏹️ Música parada e fila limpa.")
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
