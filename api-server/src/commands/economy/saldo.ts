import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_PRIMARY, fmt, authorFooter, footerData } from "../util.js";

export default async function saldo(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));

  const c = user?.coins ?? 0;
  const b = user?.bank ?? 0;

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setAuthor({ name: `Carteira de ${target.username}`, iconURL: target.displayAvatarURL() })
    .addFields(
      { name: "💵 Carteira", value: `🪙 ${fmt(c)}`, inline: true },
      { name: "🏦 Banco", value: `🪙 ${fmt(b)}`, inline: true },
      { name: "💰 Total", value: `🪙 ${fmt(c + b)}`, inline: true },
    )
    .setFooter(footerData(message))
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
