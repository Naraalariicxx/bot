import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_GOLD, COLOR_ERROR, COLOR_PRIMARY, fmt, authorFooter } from "../util.js";

export default async function dados(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  const balance = user?.coins ?? 0;

  const bet = parseInt(args[0] ?? "", 10);
  const guess = parseInt(args[1] ?? "", 10); // optional: guess 1-6

  if (!bet || isNaN(bet) || bet <= 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `ldados <aposta> [número 1-6]`")] });
    return;
  }
  if (bet > balance) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Saldo insuficiente! Você tem 🪙 **${fmt(balance)}**`)] });
    return;
  }

  const DIE = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2;

  let winnings: number;
  let resultText: string;

  if (guess >= 1 && guess <= 6) {
    // Guessing mode: guess one die
    const hit = roll1 === guess || roll2 === guess;
    winnings = hit ? bet * 3 : -bet;
    resultText = hit
      ? `🎯 Acertou! Você apostou no **${guess}** e saiu! Ganhou 3x — 🪙 **+${fmt(bet * 3)}**`
      : `❌ Errou! Você apostou no **${guess}**. Perdeu 🪙 **${fmt(bet)}**`;
  } else {
    // Default: over/under 7
    const over = total > 7;
    winnings = over ? bet : -bet;
    resultText = over
      ? `📈 Total **${total}** — acima de 7! Ganhou 🪙 **+${fmt(bet)}**`
      : `📉 Total **${total}** — abaixo de 7! Perdeu 🪙 **${fmt(bet)}**`;
  }

  const newBal = balance + winnings;
  await db.update(usersTable).set({ coins: newBal }).where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(winnings > 0 ? COLOR_GOLD : COLOR_PRIMARY)
    .setAuthor(authorFooter(message))
    .setTitle("🎲 Dados")
    .setDescription(`${DIE[roll1-1]} ${DIE[roll2-1]} → **${total}**\n\n${resultText}\nSaldo: 🪙 **${fmt(newBal)}**`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
