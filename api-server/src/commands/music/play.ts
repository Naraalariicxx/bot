import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY, COLOR_ERROR, authorFooter } from "../util.js";
import { addToQueue, getQueue } from "./queue.js";

export default async function play(message: Message, args: string[]): Promise<void> {
  const query = args.join(" ");
  if (!query) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lplay <nome da música ou URL>`")] });
    return;
  }

  const vc = message.member?.voice.channel;
  if (!vc) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa estar em um canal de voz!")] });
    return;
  }

  const guildId = message.guild!.id;
  addToQueue(guildId, { title: query, url: query, requestedBy: message.author.username });
  const q = getQueue(guildId);

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setAuthor(authorFooter(message))
    .setTitle("🎵 Adicionado à fila")
    .addFields(
      { name: "Música", value: `\`${query}\``, inline: false },
      { name: "Posição na fila", value: `${q.length}`, inline: true },
      { name: "Canal", value: vc.name, inline: true },
    )
    .setFooter({ text: "Sistema de música — conecte o bot ao seu canal de voz para ouvir." })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
