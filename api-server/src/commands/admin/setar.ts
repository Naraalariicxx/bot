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
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar prefix <prefixo>` ou `lsetar tellonym painel #canal`")] });
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
    const sub2  = args[1]?.toLowerCase();
    const guildId = message.guild!.id;

    if (sub2 === "desativar") {
      await db.update(guildSettingsTable)
        .set({ tellonymPanelChannelId: null, tellonymSendChannelId: null, tellonymApproveChannelId: null })
        .where(eq(guildSettingsTable.id, guildId));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription("✅ Sistema de tellonym desativado.")] });
      return;
    }

    if (sub2 === "setup") {
      const [settings] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.id, guildId));
      if (!settings?.tellonymPanelChannelId) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Configure o canal do painel primeiro: `lsetar tellonym painel #canal`")] });
        return;
      }
      const ch = message.guild!.channels.cache.get(settings.tellonymPanelChannelId);
      if (!(ch instanceof TextChannel)) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Canal do painel não encontrado.")] });
        return;
      }
      const targetUser = message.mentions.users.first() ?? message.author;
      await postTellonymPanel(ch, targetUser, settings.tellonymBannerUrl ?? null);
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Painel criado em <#${ch.id}> para **${targetUser.username}**!`)] });
      return;
    }

    if (sub2 === "banner") {
      const url = args[2];
      if (!url || !url.startsWith("http")) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Informe uma URL válida.\nEx: `lsetar tellonym banner https://...`")] });
        return;
      }
      await db.update(guildSettingsTable).set({ tellonymBannerUrl: url }).where(eq(guildSettingsTable.id, guildId));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription("✅ Banner atualizado!").setImage(url)] });
      return;
    }

    if (sub2 === "painel") {
      const channel = message.mentions.channels.first();
      if (!channel || channel.type !== ChannelType.GuildText) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar tellonym painel #canal`")] });
        return;
      }
      await db.update(guildSettingsTable).set({ tellonymPanelChannelId: channel.id }).where(eq(guildSettingsTable.id, guildId));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Canal do painel configurado: <#${channel.id}>`)] });
      return;
    }

    if (sub2 === "enviar") {
      const channel = message.mentions.channels.first();
      if (!channel || channel.type !== ChannelType.GuildText) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar tellonym enviar #canal`")] });
        return;
      }
      await db.update(guildSettingsTable).set({ tellonymSendChannelId: channel.id }).where(eq(guildSettingsTable.id, guildId));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Canal de mensagens aprovadas: <#${channel.id}>`)] });
      return;
    }

    if (sub2 === "aprovar") {
      const channel = message.mentions.channels.first();
      if (!channel || channel.type !== ChannelType.GuildText) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lsetar tellonym aprovar #canal`")] });
        return;
      }
      await db.update(guildSettingsTable).set({ tellonymApproveChannelId: channel.id }).where(eq(guildSettingsTable.id, guildId));
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ Canal de moderação configurado: <#${channel.id}>`)] });
      return;
    }

    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(
      "❌ Subcomando inválido. Opções:\n" +
      "`lsetar tellonym painel #canal` — canal do painel\n" +
      "`lsetar tellonym enviar #canal` — canal de msgs aprovadas\n" +
      "`lsetar tellonym aprovar #canal` — canal de moderação\n" +
      "`lsetar tellonym setup [@user]` — criar painel com botão\n" +
      "`lsetar tellonym banner <url>` — imagem do painel\n" +
      "`lsetar tellonym desativar` — desativar tudo"
    )] });
    return;
  }

  await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Subcomando desconhecido.")] });
}
