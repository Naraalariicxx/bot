import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, fmt, authorFooter } from "../util.js";

export default async function dar(message: Message, args: string[]): Promise<void> {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa ser Administrador para usar este comando.")] });
    return;
  }

  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `ldar @usuario <valor>`")] });
    return;
  }

  const amount = parseInt(args.find(a => /^-?\d+$/.test(a)) ?? "", 10);
  if (isNaN(amount)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Informe um valor válido.")] });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
  const current = user?.coins ?? 0;
  await db.update(usersTable).set({ coins: Math.max(0, current + amount) }).where(eq(usersTable.id, target.id));

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setDescription(
      amount >= 0
        ? `💰 **${fmt(amount)}** coins dados para **${target.username}**`
        : `💸 **${fmt(Math.abs(amount))}** coins removidos de **${target.username}**`
    )
    .addFields({ name: "Novo saldo", value: `🪙 ${fmt(Math.max(0, current + amount))}`, inline: true })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
