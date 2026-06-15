import { EmbedBuilder, Message, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
import { db, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, authorFooter } from "../util.js";
import { postTellonymPanel } from "../../lib/bot-features.js";

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
    if (sub2 === "setup") {
      const [settings] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.id, message.guild!.id));
      if (!settings?.tellonymChannelId) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Configure o canal primeiro: `lsetar tellonym #canal`")] });
        return;
      }
      const ch = message.guild!.channels.cache.get(settings.tellonymChannelId);
      if (!(ch instanceof TextChannel)) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Canal configurado não encontrado.")] });
        return;
      }
      const targetUser = message.mentions.users.first() ?? message.author;
      await postTellonymPanel(ch, targetUser, settings.tellonymBannerUrl ?? null);
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Painel de tellonym criado em <#${ch.id}> para **${targetUser.username}**!`)] });
      return;
    }

    if (sub2 === "banner") {
      const url = args[2];
      if (!url || !url.startsWith("http")) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Informe uma URL válida.\nEx: `lsetar tellonym banner https://...`")] });
        return;
      }
      await db.update(guildSettingsTable).set({ tellonymBannerUrl: url }).where(eq(guildSettingsTable.id, message.guild!.id));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Banner do tellonym atualizado!`).setImage(url)] });
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
