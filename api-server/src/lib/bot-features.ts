import {
  Message, TextChannel, NewsChannel, User,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ModalSubmitInteraction, ButtonInteraction,
} from "discord.js";
import { db, usersTable, duelsTable, tellonymTable, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

function isSendable(ch: Message["channel"]): ch is TextChannel | NewsChannel {
  return ch instanceof TextChannel || ch instanceof NewsChannel;
}

// ── Duelo (legado) ────────────────────────────────────────────────────────────
export async function handleDuel(message: Message, args: string[]): Promise<void> {
  const guild     = message.guild!;
  const challenger = message.author;
  const mention   = message.mentions.users.first();

  if (!mention) { await message.reply("❌ Mencione um usuário para duelar! Ex: `lduelo @usuario 500`"); return; }
  if (mention.id === challenger.id || mention.bot) { await message.reply("❌ Alvo inválido para duelo."); return; }

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
    challengerId: challenger.id, challengerUsername: challenger.username,
    challengedId: mention.id,   challengedUsername: mention.username,
    winnerId: winner.id,        winnerUsername: winner.username,
    bet, guildId: guild.id, guildName: guild.name,
  });

  const betText = bet > 0 ? ` por **${bet.toLocaleString("pt-BR")} coins**` : "";
  await message.reply(
    `⚔️ **${challenger.username}** desafiou **${mention.username}** para um duelo${betText}!\n\n` +
    `🏆 **${winner.username}** venceu!${bet > 0 ? ` +${bet.toLocaleString("pt-BR")} coins` : ""}`
  );
}

// ── Tellonym: inbox ───────────────────────────────────────────────────────────
export async function handleInbox(message: Message): Promise<void> {
  const userId = message.author.id;
  const messages = await db.select().from(tellonymTable)
    .where(eq(tellonymTable.targetUserId, userId))
    .orderBy(tellonymTable.sentAt);

  if (!messages.length) { await message.reply("📭 Sua caixa de entrada está vazia."); return; }

  await db.update(tellonymTable).set({ isRead: true }).where(eq(tellonymTable.targetUserId, userId));

  const unread  = messages.filter((m) => !m.isRead);
  const preview = messages.slice(-5).reverse();
  const lines   = preview.map((m, i) => `**${i + 1}.** ${m.message}${m.reply ? `\n   ↩️ *${m.reply}*` : ""}`).join("\n\n");

  await message.reply(
    `📬 **Sua caixa de entrada** (${messages.length} total, ${unread.length} não lidas)\n\n` +
    lines +
    (messages.length > 5 ? `\n\n_...e mais ${messages.length - 5} mensagens._` : "")
  );
}

// ── Tellonym: painel com botão ────────────────────────────────────────────────
export async function postTellonymPanel(channel: TextChannel, targetUser: User, bannerUrl: string | null): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x7B2FBE)
    .setTitle(`TELLONYM – ${targetUser.displayName.toUpperCase()} 📋`)
    .setDescription(
      `▸ Mande sua mensagem de forma anônima ou se preferir pode enviar mostrando seu perfil.\n` +
      `▸ Perguntas, opiniões, indiretas ou o que quiserem falar e expressar.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tellonym_send_${targetUser.id}`)
      .setLabel("Enviar Tellonym")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── Tellonym: modal ───────────────────────────────────────────────────────────
export function buildTellonymModal(targetUserId: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`tellonym_modal_${targetUserId}`)
    .setTitle("Enviar Mensagem Anônima");

  const input = new TextInputBuilder()
    .setCustomId("tellonym_message")
    .setLabel("Sua mensagem")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Digite sua mensagem aqui...")
    .setMinLength(2)
    .setMaxLength(500)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  return modal;
}

// ── Tellonym: submit modal → canal de aprovação ───────────────────────────────
export async function processTellonymModal(interaction: ModalSubmitInteraction): Promise<void> {
  const targetUserId = interaction.customId.replace("tellonym_modal_", "");
  const msgText      = interaction.fields.getTextInputValue("tellonym_message").trim();
  const guild        = interaction.guild!;

  const targetMember   = await guild.members.fetch(targetUserId).catch(() => null);
  const targetUsername = targetMember?.user.username ?? "desconhecido";

  const [row] = await db.insert(tellonymTable).values({
    targetUserId, targetUsername, message: msgText,
    isRead: false, status: "pending",
    guildId: guild.id, guildName: guild.name,
  }).returning();

  await interaction.reply({ content: "✅ Mensagem enviada! Aguarde a aprovação.", ephemeral: true });

  const [settings] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.id, guild.id));
  const approveChannelId = settings?.tellonymApproveChannelId;
  if (!approveChannelId) return;

  const approveCh = guild.channels.cache.get(approveChannelId);
  if (!(approveCh instanceof TextChannel)) return;

  const approveEmbed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("📬 Nova mensagem tellonym")
    .setDescription(`**Para:** ${targetMember?.toString() ?? targetUsername}\n\n> ${msgText}`)
    .setFooter({ text: `ID #${row.id}` })
    .setTimestamp();

  const approveRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tellonym_approve_${row.id}`)
      .setLabel("✅ Aprovar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`tellonym_reject_${row.id}`)
      .setLabel("❌ Rejeitar")
      .setStyle(ButtonStyle.Danger)
  );

  await approveCh.send({ embeds: [approveEmbed], components: [approveRow] });
}

// ── Tellonym: aprovar / rejeitar ──────────────────────────────────────────────
export async function processTellonymApprove(interaction: ButtonInteraction): Promise<void> {
  const msgId  = parseInt(interaction.customId.replace("tellonym_approve_", ""), 10);
  const guild  = interaction.guild!;

  const [tell] = await db.select().from(tellonymTable).where(eq(tellonymTable.id, msgId));
  if (!tell) { await interaction.reply({ content: "❌ Mensagem não encontrada.", ephemeral: true }); return; }

  await db.update(tellonymTable).set({ status: "approved" }).where(eq(tellonymTable.id, msgId));

  const [settings] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.id, guild.id));
  const sendChannelId = settings?.tellonymSendChannelId;

  if (sendChannelId) {
    const sendCh = guild.channels.cache.get(sendChannelId);
    if (sendCh instanceof TextChannel) {
      const publicEmbed = new EmbedBuilder()
        .setColor(0x7B2FBE)
        .setTitle(`📬 TELLONYM – ${tell.targetUsername.toUpperCase()}`)
        .setDescription(`> ${tell.message}`)
        .setTimestamp();
      await sendCh.send({ embeds: [publicEmbed] });
    }
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("✅ Mensagem aprovada")
        .setDescription(`> ${tell.message}`)
        .setFooter({ text: `Aprovado por ${interaction.user.username}` })
        .setTimestamp()
    ],
    components: [],
  });
}

export async function processTellonymReject(interaction: ButtonInteraction): Promise<void> {
  const msgId = parseInt(interaction.customId.replace("tellonym_reject_", ""), 10);

  await db.update(tellonymTable).set({ status: "rejected" }).where(eq(tellonymTable.id, msgId));

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("❌ Mensagem rejeitada")
        .setFooter({ text: `Rejeitado por ${interaction.user.username}` })
        .setTimestamp()
    ],
    components: [],
  });
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
