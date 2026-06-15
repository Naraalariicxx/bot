import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, fmt, authorFooter } from "../util.js";

export default async function transferir(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Mencione quem vai receber. Ex: `ltransferir @usuario 500`")] });
    return;
  }
  if (target.bot || target.id === message.author.id) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Não é possível transferir para você mesmo ou para um bot.")] });
    return;
  }

  const amount = parseInt(args.find(a => /^\d+$/.test(a)) ?? "", 10);
  if (!amount || amount <= 0) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Informe um valor válido.")] });
    return;
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, message.author.id));
  if (!sender || sender.coins < amount) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Saldo insuficiente! Você tem 🪙 **${fmt(sender?.coins ?? 0)}**`)] });
    return;
  }

  const [recv] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));

  await db.update(usersTable).set({ coins: sender.coins - amount }).where(eq(usersTable.id, message.author.id));
  await db.update(usersTable).set({ coins: (recv?.coins ?? 0) + amount }).where(eq(usersTable.id, target.id));

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setAuthor(authorFooter(message))
    .setTitle("💸 Transferência realizada!")
    .addFields(
      { name: "Enviado", value: `🪙 ${fmt(amount)}`, inline: true },
      { name: "Para", value: target.username, inline: true },
      { name: "Seu novo saldo", value: `🪙 ${fmt(sender.coins - amount)}`, inline: true },
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
