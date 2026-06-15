import { EmbedBuilder, Message, PermissionFlagsBits, TextChannel, NewsChannel } from "discord.js";
import { COLOR_PRIMARY, COLOR_ERROR, footerData } from "../util.js";

export default async function anunciar(message: Message, args: string[]): Promise<void> {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa ser Administrador.")] });
    return;
  }

  const text = args.join(" ");
  if (!text) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lanunciar <mensagem>`")] });
    return;
  }

  try { await message.delete(); } catch { /* no permission */ }

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle("📢 Anúncio")
    .setDescription(text)
    .setAuthor({ name: message.guild?.name ?? "Bot", iconURL: message.guild?.iconURL() ?? undefined })
    .setFooter(footerData(message))
    .setTimestamp();

  const ch = message.channel;
  if (ch instanceof TextChannel || ch instanceof NewsChannel) {
    await ch.send({ embeds: [embed] });
  } else {
    await message.reply({ embeds: [embed] });
  }
}
