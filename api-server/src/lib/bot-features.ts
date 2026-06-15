import { Message, TextChannel, NewsChannel } from "discord.js";
import { db, usersTable, duelsTable, tellonymTable, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

function isSendable(ch: Message["channel"]): ch is TextChannel | NewsChannel {
  return ch instanceof TextChannel || ch instanceof NewsChannel;
}

export async function handleDuel(message: Message, args: string[]): Promise<void> {
  const guild = message.guild!;
  const challenger = message.author;
  const mention = message.mentions.users.first();

  if (!mention) {
    await message.reply("❌ Mencione um usuário para duelar! Ex: `lduelo @usuario 500`");
    return;
  }
  if (mention.id === challenger.id || mention.bot) {
    await message.reply("❌ Alvo inválido para duelo.");
    return;
  }

  const bet = Math.max(0, parseInt(args.find((a) => /^\d+$/.test(a)) ?? "0", 10));

  const [challengerData] = await db.select().from(usersTable).where(eq(usersTable.id, challenger.id));
  if (bet > 0 && (!challengerData || challengerData.coins < bet)) {
    await message.reply(`❌ Você não tem coins suficientes! Saldo: **${challengerData?.coins ?? 0}** coins`);
    return;
  }

  await ensureUser(mention.id, mention.username, mention.discriminator, mention.displayAvatarURL(), guild.id);
  const [mentionData] = await db.select().from(usersTable).where(eq(usersTable.id, mention.id));

  if (bet > 0 && (!mentionData || mentionData.coins < bet)) {
    await message.reply(`❌ **${mention.username}** não tem coins suficientes para esta aposta!`);
    return;
  }

  const challengerWins = Math.random() < 0.5;
  const winner = challengerWins ? challenger : mention;
  const loser  = challengerWins ? mention : challenger;

  if (bet > 0) {
    await db.update(usersTable)
      .set({ coins: (challengerWins ? challengerData! : mentionData!).coins + bet })
      .where(eq(usersTable.id, winner.id));
    await db.update(usersTable)
      .set({ coins: (challengerWins ? mentionData! : challengerData!).coins - bet })
      .where(eq(usersTable.id, loser.id));
  }

  await db.insert(duelsTable).values({
    challengerId: challenger.id,
    challengerUsername: challenger.username,
    challengedId: mention.id,
    challengedUsername: mention.username,
    winnerId: winner.id,
    winnerUsername: winner.username,
    bet,
    guildId: guild.id,
    guildName: guild.name,
  });

  const betText = bet > 0 ? ` por **${bet.toLocaleString("pt-BR")} coins**` : "";
  await message.reply(
    `⚔️ **${challenger.username}** desafiou **${mention.username}** para um duelo${betText}!\n\n` +
    `🏆 **${winner.username}** venceu!${bet > 0 ? ` +${bet.toLocaleString("pt-BR")} coins` : ""}`
  );
}

export async function handleTellonym(message: Message, args: string[]): Promise<void> {
  const guild = message.guild!;
  const sender = message.author;
  const mention = message.mentions.users.first();

  if (!mention) {
    await message.reply("❌ Mencione um usuário! Ex: `ltellonym @usuario sua mensagem aqui`");
    return;
  }
  if (mention.bot) {
    await message.reply("❌ Não é possível enviar mensagem para um bot!");
    return;
  }

  const msgText = message.content
    .replace(`<@${mention.id}>`, "")
    .replace(`<@!${mention.id}>`, "")
    .slice("ltellonym".length + 1)
    .trim();

  if (!msgText || msgText.length < 2) {
    await message.reply("❌ A mensagem está vazia! Ex: `ltellonym @usuario sua mensagem`");
    return;
  }
  if (msgText.length > 500) {
    await message.reply("❌ Mensagem muito longa! Máximo de 500 caracteres.");
    return;
  }

  await ensureUser(mention.id, mention.username, mention.discriminator, mention.displayAvatarURL(), guild.id);

  await db.insert(tellonymTable).values({
    targetUserId: mention.id,
    targetUsername: mention.username,
    message: msgText,
    isRead: false,
    guildId: guild.id,
    guildName: guild.name,
  });

  try { await message.delete(); } catch { /* no perm */ }

  const [settings] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.id, guild.id));
  const tellonymChannelId = settings?.tellonymChannelId;

  if (tellonymChannelId) {
    const ch = guild.channels.cache.get(tellonymChannelId);
    if (ch instanceof TextChannel) {
      await ch.send(`📬 **${mention}** você recebeu uma mensagem anônima!\n> ${msgText}\n\n_Use \`linbox\` para ver sua caixa de entrada._`).catch(() => null);
    }
  } else {
    try {
      await mention.send(
        `📬 **Você recebeu uma mensagem anônima em ${guild.name}!**\n\n> ${msgText}\n\n_Use \`linbox\` no servidor para ver sua caixa de entrada._`
      );
    } catch {
      if (isSendable(message.channel)) {
        const dm = await message.channel.send(`📬 **${mention}**, você recebeu uma mensagem anônima! Use \`linbox\` para ver.`);
        setTimeout(() => dm.delete().catch(() => null), 8000);
      }
    }
  }

  if (isSendable(message.channel)) {
    const confirm = await message.channel.send(`✅ <@${sender.id}> Mensagem anônima enviada para **${mention.username}**!`);
    setTimeout(() => confirm.delete().catch(() => null), 5000);
  }
}

export async function handleInbox(message: Message): Promise<void> {
  const userId = message.author.id;
  const messages = await db.select().from(tellonymTable).where(eq(tellonymTable.targetUserId, userId)).orderBy(tellonymTable.sentAt);

  if (!messages.length) {
    await message.reply("📭 Sua caixa de entrada está vazia.");
    return;
  }

  await db.update(tellonymTable).set({ isRead: true }).where(eq(tellonymTable.targetUserId, userId));

  const unread = messages.filter((m) => !m.isRead);
  const preview = messages.slice(-5).reverse();

  const lines = preview.map((m, i) => `**${i + 1}.** ${m.message}${m.reply ? `\n   ↩️ *${m.reply}*` : ""}`).join("\n\n");

  await message.reply(
    `📬 **Sua caixa de entrada** (${messages.length} total, ${unread.length} não lidas)\n\n` +
    lines +
    (messages.length > 5 ? `\n\n_...e mais ${messages.length - 5} mensagens. Veja todas no dashboard._` : "")
  );
}

async function ensureUser(userId: string, username: string, discriminator: string, avatarUrl: string, guildId: string): Promise<void> {
  try {
    await db
      .insert(usersTable)
      .values({ id: userId, username, discriminator, avatarUrl, guildId })
      .onConflictDoUpdate({ target: usersTable.id, set: { username, discriminator, avatarUrl } });
  } catch (err) {
    logger.error({ err }, "Failed to upsert user");
  }
}
