import { EmbedBuilder, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_GOLD, COLOR_ERROR, COLOR_SUCCESS, COLOR_PRIMARY, fmt, authorFooter } from "../util.js";

type Card = { suit: string; value: string; num: number };

const SUITS  = ["♠️","♥️","♦️","♣️"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS)
    for (const v of VALUES) {
      const n = v === "A" ? 11 : ["J","Q","K"].includes(v) ? 10 : parseInt(v);
      deck.push({ suit: s, value: v, num: n });
    }
  return deck.sort(() => Math.random() - 0.5);
}

function score(hand: Card[]): number {
  let total = hand.reduce((s, c) => s + c.num, 0);
  let aces = hand.filter(c => c.value === "A").length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

function display(hand: Card[], hideSecond = false): string {
  return hand.map((c, i) => (hideSecond && i === 1 ? "🂠" : `${c.value}${c.suit}`)).join(" ");
}

export default async function blackjack(message: Message, args: string[]): Promise<void> {
  const uid = message.author.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  const balance = user?.coins ?? 0;

  const raw = args[0]?.toLowerCase();
  const bet = raw === "tudo" || raw === "all" ? balance : parseInt(args[0] ?? "", 10);

  if (!bet || isNaN(bet) || bet <= 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lblackjack <aposta>`")] });
    return;
  }
  if (bet > balance) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Saldo insuficiente! Você tem 🪙 **${fmt(balance)}**`)] });
    return;
  }

  const deck = newDeck();
  const player: Card[] = [deck.pop()!, deck.pop()!];
  const dealer: Card[] = [deck.pop()!, deck.pop()!];

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("bj_hit").setLabel("🃏 Pedir").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("bj_stand").setLabel("🛑 Parar").setStyle(ButtonStyle.Secondary),
  );

  function buildEmbed(ended = false, result = "") {
    return new EmbedBuilder()
      .setColor(result.includes("Ganhou") ? COLOR_GOLD : result.includes("Perdeu") ? COLOR_ERROR : COLOR_PRIMARY)
      .setAuthor(authorFooter(message))
      .setTitle("🃏 Blackjack")
      .addFields(
        { name: `Dealer (${ended ? score(dealer) : "?"})`, value: display(dealer, !ended), inline: true },
        { name: `Você (${score(player)})`, value: display(player), inline: true },
      )
      .setDescription(result || `Aposta: 🪙 **${fmt(bet)}**`)
      .setTimestamp();
  }

  // Instant blackjack check
  if (score(player) === 21) {
    const winnings = Math.floor(bet * 1.5);
    await db.update(usersTable).set({ coins: balance + winnings }).where(eq(usersTable.id, uid));
    await message.reply({ embeds: [buildEmbed(true, `🎉 Blackjack! Ganhou 🪙 **+${fmt(winnings)}**`)] });
    return;
  }

  const reply = await message.reply({ embeds: [buildEmbed()], components: [row] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.user.id === uid,
    time: 60_000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "bj_hit") {
      player.push(deck.pop()!);
      const ps = score(player);
      if (ps > 21) {
        collector.stop("bust");
        await db.update(usersTable).set({ coins: balance - bet }).where(eq(usersTable.id, uid));
        await interaction.update({ embeds: [buildEmbed(true, `💥 Bust! Perdeu 🪙 **${fmt(bet)}**\nNovo saldo: 🪙 **${fmt(balance - bet)}**`)], components: [] });
      } else if (ps === 21) {
        collector.stop("stand");
        await interaction.update({ embeds: [buildEmbed()], components: [row] });
      } else {
        await interaction.update({ embeds: [buildEmbed()], components: [row] });
      }
    } else {
      collector.stop("stand");
      // Dealer draws
      while (score(dealer) < 17) dealer.push(deck.pop()!);
      const ps = score(player); const ds = score(dealer);
      let result = "";
      let delta = 0;
      if (ds > 21 || ps > ds)      { delta = bet;  result = `🎉 Ganhou 🪙 **+${fmt(bet)}**!`; }
      else if (ps === ds)           { delta = 0;   result = `🤝 Empate! Aposta devolvida.`; }
      else                          { delta = -bet; result = `💸 Perdeu 🪙 **${fmt(bet)}**`; }
      result += `\nNovo saldo: 🪙 **${fmt(balance + delta)}**`;
      await db.update(usersTable).set({ coins: balance + delta }).where(eq(usersTable.id, uid));
      await interaction.update({ embeds: [buildEmbed(true, result)], components: [] });
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await reply.edit({ components: [] });
    }
  });
}
