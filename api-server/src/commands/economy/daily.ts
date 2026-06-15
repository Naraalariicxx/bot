import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_GOLD, COLOR_ERROR, fmt, cooldownLeft, formatMs, authorFooter } from "../util.js";

const COOLDOWN = 24 * 60 * 60 * 1000;
const MIN = 400;
const MAX = 800;

export default async function daily(message: Message): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));

  const cd = cooldownLeft(user?.lastDaily ?? null, COOLDOWN);
  if (cd > 0) {
    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setDescription(`⏰ Você já coletou o daily hoje!\nTente novamente em **${formatMs(cd)}**.`);
    await message.reply({ embeds: [embed] });
    return;
  }

  const reward = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

  await db
    .update(usersTable)
    .set({ coins: (user?.coins ?? 0) + reward, lastDaily: new Date() })
    .where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(COLOR_GOLD)
    .setAuthor(authorFooter(message))
    .setTitle("🎁 Daily coletado!")
    .setDescription(`Você recebeu 🪙 **${fmt(reward)}** coins!\n\nNovo saldo: 🪙 **${fmt((user?.coins ?? 0) + reward)}**`)
    .setFooter({ text: "Volte amanhã para coletar novamente!" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
