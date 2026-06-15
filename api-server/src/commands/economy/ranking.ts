import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { COLOR_GOLD, fmt, footerData } from "../util.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function ranking(message: Message): Promise<void> {
  const rows = await db
    .select()
    .from(usersTable)
    .orderBy(desc(sql`coins + bank`))
    .limit(10);

  const lines = rows.map((u, i) => {
    const medal = MEDALS[i] ?? `**${i + 1}.**`;
    const total = u.coins + u.bank;
    return `${medal} **${u.username}** — 🪙 ${fmt(total)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR_GOLD)
    .setTitle("🏆 Ranking de Economia")
    .setDescription(lines.join("\n") || "Nenhum usuário registrado.")
    .setFooter(footerData(message))
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
