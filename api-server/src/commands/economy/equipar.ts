import { EmbedBuilder, Message } from "discord.js";
import { db, inventoryTable, shopItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, authorFooter } from "../util.js";

export default async function equipar(message: Message, args: string[]): Promise<void> {
  const itemId = parseInt(args[0] ?? "", 10);
  if (isNaN(itemId)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lequipar <id do item>`")] });
    return;
  }

  const [invItem] = await db.select().from(inventoryTable).where(
    and(eq(inventoryTable.userId, message.author.id), eq(inventoryTable.itemId, itemId))
  );

  if (!invItem) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você não possui esse item. Use `linventario` para ver o que você tem.")] });
    return;
  }

  const [shopItem] = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, itemId));

  const alreadyEquipped = invItem.equipped === true;
  await db.update(inventoryTable).set({ equipped: !alreadyEquipped }).where(eq(inventoryTable.id, invItem.id));

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setDescription(alreadyEquipped
      ? `🔓 **${shopItem?.name ?? "Item"}** foi desequipado.`
      : `✅ **${shopItem?.name ?? "Item"}** foi equipado com sucesso!`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
