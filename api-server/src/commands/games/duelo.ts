import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { db, usersTable, duelsTable } from "../../database/db.js";
import { eq } from "drizzle-orm";

const COLOR_GOLD    = 0xfee75c;
const COLOR_SUCCESS = 0x57f287;
const COLOR_ERROR   = 0xed4245;

async function ensureUser(id: string, username: string, discriminator: string, avatarUrl: string, guildId: string) {
  await db.insert(usersTable).values({ id, username, discriminator, avatarUrl, guildId })
    .onConflictDoUpdate({ target: usersTable.id, set: { username, discriminator, avatarUrl } });
}

export default async function duelo(message: Message, args: string[]): Promise<void> {
  const guild     = message.guild!;
  const challenger = message.author;
  const mention   = message.mentions.users.first();

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

  const betText = bet > 0 ? ` por **${bet.toLocaleString("pt-BR")} coins**` : "";

  const challengeMsg = await message.reply({
    embeds: [new EmbedBuilder()
      .setColor(COLOR_GOLD)
      .setTitle("⚔️ Desafio de Duelo!")
      .setDescription(
        `**${challenger.username}** desafiou **${mention.username}** para um duelo${betText}!\n\n` +
        `${mention}, você aceita o desafio?\nDigite \`aceitar\` ou \`recusar\` em **30 segundos**.`
      )
      .setTimestamp()],
  });

  const filter = (m: Message) =>
    m.author.id === mention.id &&
    ["aceitar", "recusar", "accept", "decline"].includes(m.content.toLowerCase().trim());

  let response: Message | null = null;
  try {
    const collected = await (message.channel as TextChannel).awaitMessages({ filter, max: 1, time: 30_000, errors: ["time"] });
    response = collected.first() ?? null;
  } catch {
    await challengeMsg.edit({
      embeds: [new EmbedBuilder().setColor(COLOR_ERROR)
        .setDescription(`⏰ **${mention.username}** não respondeu a tempo. Duelo cancelado.`)],
    });
    return;
  }

  const accepted = ["aceitar", "accept"].includes(response?.content.toLowerCase().trim() ?? "");

  if (!accepted) {
    await message.reply({
      embeds: [new EmbedBuilder().setColor(COLOR_ERROR)
        .setDescription(`❌ **${mention.username}** recusou o duelo!`)],
    });
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

  await message.reply({
    embeds: [new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setTitle("⚔️ Resultado do Duelo!")
      .setDescription(
        `**${challenger.username}** vs **${mention.username}**${betText}\n\n` +
        `🏆 **${winner.username}** venceu!` +
        (bet > 0 ? `\n🪙 +**${bet.toLocaleString("pt-BR")} coins**` : "")
      )
      .setTimestamp()],
  });
}
