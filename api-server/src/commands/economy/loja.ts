import { EmbedBuilder, Message } from "discord.js";
import { db, shopItemsTable } from "@workspace/db";
import { COLOR_PRIMARY, fmt, authorFooter } from "../util.js";

export default async function loja(message: Message, _args: string[]): Promise<void> {
  const items = await db.select().from(shopItemsTable).orderBy(shopItemsTable.category, shopItemsTable.price);

  if (!items.length) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_PRIMARY).setDescription("🛒 A loja está vazia no momento.")] });
    return;
  }

  const byCategory: Record<string, typeof items> = {};
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category]!.push(item);
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle("🛒 Loja")
    .setFooter({ ...authorFooter(message), text: `Use lcomprar <id> para comprar • ${authorFooter(message).name}` })
    .setTimestamp();

  for (const [cat, catItems] of Object.entries(byCategory)) {
    const lines = catItems.map(i => `**[${i.id}]** ${i.emoji} ${i.name} — 🪙 ${fmt(i.price)}\n  *${i.description || "Sem descrição"}*`);
    embed.addFields({ name: `📦 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`, value: lines.join("\n"), inline: false });
  }

  await message.reply({ embeds: [embed] });
}
