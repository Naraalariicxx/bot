import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_PRIMARY, COLOR_WARN, authorFooter } from "../util.js";

export default async function afk(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));

  if (user?.isAfk) {
    await db.update(usersTable).set({ isAfk: false, afkMessage: null }).where(eq(usersTable.id, uid));
    const embed = new EmbedBuilder()
      .setColor(COLOR_PRIMARY)
      .setDescription(`👋 Bem-vindo de volta, **${message.author.username}**! Seu AFK foi removido.`);
    await message.reply({ embeds: [embed] });
    return;
  }

  const reason = args.join(" ") || "AFK";
  await db.update(usersTable).set({ isAfk: true, afkMessage: reason }).where(eq(usersTable.id, uid));

  const embed = new EmbedBuilder()
    .setColor(COLOR_WARN)
    .setAuthor(authorFooter(message))
    .setDescription(`💤 **${message.author.username}** entrou em AFK: *${reason}*`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

export async function checkAfk(message: Message): Promise<void> {
  // Notify if someone mentions an AFK user
  for (const user of message.mentions.users.values()) {
    if (user.bot || user.id === message.author.id) continue;
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    if (dbUser?.isAfk) {
      const embed = new EmbedBuilder()
        .setColor(COLOR_WARN)
        .setDescription(`💤 **${user.username}** está AFK: *${dbUser.afkMessage ?? "Ausente"}*`);
      await message.reply({ embeds: [embed] });
    }
  }

  // Clear AFK when the AFK user sends a message
  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, message.author.id));
  if (sender?.isAfk && !message.content.startsWith("lafk")) {
    await db.update(usersTable).set({ isAfk: false, afkMessage: null }).where(eq(usersTable.id, message.author.id));
    const embed = new EmbedBuilder()
      .setColor(COLOR_PRIMARY)
      .setDescription(`👋 Bem-vindo de volta, **${message.author.username}**! Seu AFK foi removido.`);
    const reply = await message.reply({ embeds: [embed] });
    setTimeout(() => reply.delete().catch(() => null), 6000);
  }
}
