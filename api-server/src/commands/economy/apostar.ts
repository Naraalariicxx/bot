import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, COLOR_GOLD, fmt, authorFooter } from "../util.js";

export default async function apostar(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  const balance = user?.coins ?? 0;

  const raw = args[0]?.toLowerCase();
  const amount = raw === "tudo" || raw === "all" ? balance : parseInt(args[0] ?? "", 10);

  if (!amount || isNaN(amount) || amount <= 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lapostar <valor>` ou `lapostar tudo`")] });
    return;
  }
  if (amount > balance) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Você não tem coins suficientes! Saldo: 🪙 **${fmt(balance)}**`)] });
    return;
  }

  const won = Math.random() < 0.48; // ligeiramente desfavorável à casa
  const newBalance = won ? balance + amount : balance - amount;

  await db.update(usersTable).set({ coins: newBalance }).where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setAuthor(authorFooter(message))
    .setTimestamp();

  if (won) {
    embed
      .setColor(COLOR_GOLD)
      .setTitle("🎲 Você ganhou!")
      .setDescription(`Aposta: 🪙 **${fmt(amount)}**\nGanhou: 🪙 **+${fmt(amount)}**\n\nNovo saldo: 🪙 **${fmt(newBalance)}**`);
  } else {
    embed
      .setColor(COLOR_ERROR)
      .setTitle("🎲 Você perdeu!")
      .setDescription(`Aposta: 🪙 **${fmt(amount)}**\nPerdeu: 🪙 **-${fmt(amount)}**\n\nNovo saldo: 🪙 **${fmt(newBalance)}**`);
  }

  await message.reply({ embeds: [embed] });
}
