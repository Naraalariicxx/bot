import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable, shopItemsTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, fmt, authorFooter } from "../util.js";

export default async function comprar(message: Message, args: string[]): Promise<void> {
  const itemId = parseInt(args[0] ?? "", 10);
  if (isNaN(itemId)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lcomprar <id do item>`")] });
    return;
  }

  const [item] = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, itemId));
  if (!item) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Item não encontrado. Use `lloja` para ver os itens disponíveis.")] });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, message.author.id));
  if (!user || user.coins < item.price) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Coins insuficientes! Você tem 🪙 **${fmt(user?.coins ?? 0)}** e o item custa 🪙 **${fmt(item.price)}**`)] });
    return;
  }

  await db.update(usersTable).set({ coins: user.coins - item.price }).where(eq(usersTable.id, message.author.id));

  const [existing] = await db.select().from(inventoryTable).where(
    and(eq(inventoryTable.userId, message.author.id), eq(inventoryTable.itemId, itemId))
  );

  if (existing) {
    await db.update(inventoryTable).set({ quantity: existing.quantity + 1 }).where(eq(inventoryTable.id, existing.id));
  } else {
    await db.insert(inventoryTable).values({ userId: message.author.id, itemId, quantity: 1 });
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setTitle(`${item.emoji} Compra realizada!`)
    .setDescription(`Você comprou **${item.name}** por 🪙 **${fmt(item.price)}**!\n\nSaldo restante: 🪙 **${fmt(user.coins - item.price)}**`)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
