import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, cooldownLeft, formatMs, authorFooter } from "../util.js";

const COOLDOWN = 12 * 60 * 60 * 1000;

export default async function rep(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Mencione quem vai receber reputação. Ex: `lrep @usuario`")] });
    return;
  }
  if (target.bot || target.id === message.author.id) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você não pode dar reputação para si mesmo ou para bots.")] });
    return;
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, message.author.id));
  const cd = cooldownLeft(sender?.lastRep ?? null, COOLDOWN);
  if (cd > 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`⏰ Você já deu reputação recentemente!\nTente novamente em **${formatMs(cd)}**.`)] });
    return;
  }

  const [recv] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
  await db.update(usersTable).set({ reputation: (recv?.reputation ?? 0) + 1 }).where(eq(usersTable.id, target.id));
  await db.update(usersTable).set({ lastRep: new Date() }).where(eq(usersTable.id, message.author.id));

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setDescription(`⭐ **${message.author.username}** deu +1 reputação para **${target.username}**!\nReputação atual: **${(recv?.reputation ?? 0) + 1}**`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
