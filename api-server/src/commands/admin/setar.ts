import { EmbedBuilder, Message, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
import { db, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, authorFooter } from "../util.js";

export default async function setar(message: Message, args: string[]): Promise<void> {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa ser Administrador.")] });
    return;
  }

  const subCmd = args[0]?.toLowerCase();

  if (!subCmd) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar prefix <prefixo>` ou `lsetar tellonym #canal`")] });
    return;
  }

  if (subCmd === "prefix" || subCmd === "prefixo") {
    const value = args[1];
    if (!value) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar prefix <novo_prefixo>`")] });
      return;
    }
    if (value.length > 5) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ O prefixo deve ter no máximo 5 caracteres.")] });
      return;
    }
    await db.update(guildSettingsTable).set({ prefix: value }).where(eq(guildSettingsTable.id, message.guild!.id));
    const embed = new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setAuthor(authorFooter(message))
      .setDescription(`✅ Prefixo alterado para \`${value}\``)
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  if (subCmd === "tellonym") {
    const sub2 = args[1]?.toLowerCase();
    if (sub2 === "desativar" || sub2 === "disable" || sub2 === "off") {
      await db.update(guildSettingsTable).set({ tellonymChannelId: null }).where(eq(guildSettingsTable.id, message.guild!.id));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription("✅ Canal do tellonym removido. Notificações serão enviadas por DM.")] });
      return;
    }
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Mencione um canal de texto!\nEx: `lsetar tellonym #canal`\nPara desativar: `lsetar tellonym desativar`")] });
      return;
    }
    await db.update(guildSettingsTable).set({ tellonymChannelId: channel.id }).where(eq(guildSettingsTable.id, message.guild!.id));
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Canal de tellonym configurado para <#${channel.id}>.\nAs notificações de mensagens anônimas serão enviadas lá.`)] });
    return;
  }

  await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Subcomando desconhecido.\nUse `lsetar prefix <valor>` ou `lsetar tellonym #canal`")] });
}
