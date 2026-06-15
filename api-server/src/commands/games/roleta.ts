import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_GOLD, COLOR_ERROR, COLOR_PRIMARY, fmt, authorFooter } from "../util.js";

const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export default async function roleta(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  const balance = user?.coins ?? 0;

  const bet = parseInt(args[0] ?? "", 10);
  const choice = args[1]?.toLowerCase() ?? "";

  if (!bet || isNaN(bet) || bet <= 0 || !choice) {
    await message.reply({
      embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(
        "❌ Uso: `lroleta <aposta> <escolha>`\nEscolhas: `vermelho`, `preto`, `verde`, `par`, `impar`, ou um número 0-36"
      )],
    });
    return;
  }
  if (bet > balance) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Saldo insuficiente! Você tem 🪙 **${fmt(balance)}**`)] });
    return;
  }

  const num = Math.floor(Math.random() * 37); // 0-36
  const isRed = REDS.includes(num);
  const color = num === 0 ? "🟢 Verde" : isRed ? "🔴 Vermelho" : "⚫ Preto";

  let won = false;
  let mult = 2;

  if (choice === "verde" || choice === "green") {
    won = num === 0; mult = 14;
  } else if (choice === "vermelho" || choice === "red") {
    won = isRed && num !== 0; mult = 2;
  } else if (choice === "preto" || choice === "black") {
    won = !isRed && num !== 0; mult = 2;
  } else if (choice === "par" || choice === "even") {
    won = num !== 0 && num % 2 === 0; mult = 2;
  } else if (choice === "impar" || choice === "impar" || choice === "odd") {
    won = num % 2 !== 0; mult = 2;
  } else {
    const guessNum = parseInt(choice);
    if (!isNaN(guessNum) && guessNum >= 0 && guessNum <= 36) {
      won = num === guessNum; mult = 35;
    }
  }

  const winnings = won ? bet * (mult - 1) : -bet;
  const newBal = balance + winnings;
  await db.update(usersTable).set({ coins: newBal }).where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(won ? COLOR_GOLD : COLOR_PRIMARY)
    .setAuthor(authorFooter(message))
    .setTitle("🎡 Roleta")
    .setDescription(
      `A bola parou no **${num}** (${color})\n\n` +
      (won ? `🎉 Ganhou **${mult}x** — 🪙 **+${fmt(winnings)}**` : `💸 Perdeu 🪙 **${fmt(bet)}**`) +
      `\nSaldo: 🪙 **${fmt(newBal)}**`
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
