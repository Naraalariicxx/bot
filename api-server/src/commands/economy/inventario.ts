import { EmbedBuilder, Message } from "discord.js";
import { db, inventoryTable, shopItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_PRIMARY, authorFooter } from "../util.js";

export default async function inventario(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;

  const items = await db
    .select({ inv: inventoryTable, shop: shopItemsTable })
    .from(inventoryTable)
    .leftJoin(shopItemsTable, eq(inventoryTable.itemId, shopItemsTable.id))
    .where(eq(inventoryTable.userId, target.id));

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setAuthor({ name: `Inventário de ${target.username}`, iconURL: target.displayAvatarURL() })
    .setTimestamp();

  if (!items.length) {
    embed.setDescription("📦 Inventário vazio. Use `lloja` para ver itens disponíveis.");
  } else {
    const lines = items.map(({ inv, shop }) => {
      const equipped = inv.equipped ? " *(equipado)*" : "";
      return `${shop?.emoji ?? "🎁"} **${shop?.name ?? `Item #${inv.itemId}`}** x${inv.quantity}${equipped}`;
    });
    embed.setDescription(lines.join("\n"));
  }

  await message.reply({ embeds: [embed] });
}
