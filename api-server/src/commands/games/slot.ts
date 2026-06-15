import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_GOLD, COLOR_ERROR, COLOR_PRIMARY, fmt, authorFooter } from "../util.js";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"];
const WEIGHTS  = [  30,   25,   20,   15,    6,    3,    1]; // %

const MULTIPLIERS: Record<string, number> = {
  "🍒": 2, "🍋": 3, "🍊": 4, "🍇": 5, "🔔": 8, "💎": 15, "7️⃣": 50,
};

function spin(): string {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i]!;
    if (r <= 0) return SYMBOLS[i]!;
  }
  return SYMBOLS[0]!;
}

export default async function slot(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  const balance = user?.coins ?? 0;

  const raw = args[0]?.toLowerCase();
  const bet = raw === "tudo" || raw === "all" ? balance : parseInt(args[0] ?? "", 10);

  if (!bet || isNaN(bet) || bet <= 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lslot <aposta>` ou `lslot tudo`")] });
    return;
  }
  if (bet > balance) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Saldo insuficiente! Você tem 🪙 **${fmt(balance)}**`)] });
    return;
  }

  const reels = [spin(), spin(), spin()];
  const display = `[ ${reels.join(" | ")} ]`;

  let winnings = 0;
  let resultText = "";

  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // Jackpot — all three match
    const mult = MULTIPLIERS[reels[0]!] ?? 2;
    winnings = bet * mult;
    resultText = `🎉 **JACKPOT!** Ganhou ${mult}x — 🪙 **+${fmt(winnings)}**`;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    // Two match
    winnings = Math.floor(bet * 1.5);
    resultText = `✨ Dois iguais! Ganhou 1.5x — 🪙 **+${fmt(winnings)}**`;
  } else {
    winnings = -bet;
    resultText = `💸 Sem sorte! Perdeu 🪙 **${fmt(bet)}**`;
  }

  const newBal = balance + winnings;
  await db.update(usersTable).set({ coins: newBal }).where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(winnings > 0 ? COLOR_GOLD : COLOR_PRIMARY)
    .setAuthor(authorFooter(message))
    .setTitle("🎰 Caça-Níqueis")
    .setDescription(`${display}\n\n${resultText}\n\nSaldo: 🪙 **${fmt(newBal)}**`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
