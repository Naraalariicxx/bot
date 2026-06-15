import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, fmt, cooldownLeft, formatMs, authorFooter } from "../util.js";

const COOLDOWN = 60 * 60 * 1000; // 1h
const JOBS = [
  ["programador", "🖥️", 200, 600],
  ["chef", "🍳", 150, 450],
  ["motorista de delivery", "🛵", 100, 350],
  ["streamer", "🎮", 50, 800],
  ["artista", "🎨", 120, 500],
  ["professor", "📚", 180, 400],
  ["médico", "🏥", 250, 700],
  ["mecânico", "🔧", 150, 450],
  ["músico", "🎸", 80, 600],
  ["advogado", "⚖️", 300, 800],
];

export default async function trabalhar(message: Message): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));

  const cd = cooldownLeft(user?.lastWork ?? null, COOLDOWN);
  if (cd > 0) {
    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setDescription(`⏰ Você precisa descansar!\nTrabalhe novamente em **${formatMs(cd)}**.`);
    await message.reply({ embeds: [embed] });
    return;
  }

  const [jobName, emoji, min, max] = JOBS[Math.floor(Math.random() * JOBS.length)]!;
  const earned = Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min);

  await db
    .update(usersTable)
    .set({ coins: (user?.coins ?? 0) + earned, lastWork: new Date() })
    .where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setTitle(`${emoji} Você trabalhou como ${jobName}!`)
    .setDescription(`E ganhou 🪙 **${fmt(earned)}** coins!\n\nNovo saldo: 🪙 **${fmt((user?.coins ?? 0) + earned)}**`)
    .setFooter({ text: "Você pode trabalhar novamente em 1 hora." })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
