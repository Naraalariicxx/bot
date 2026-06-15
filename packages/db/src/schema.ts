import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id:            text("id").primaryKey(),
  username:      text("username").notNull(),
  discriminator: text("discriminator").notNull().default("0"),
  avatarUrl:     text("avatar_url").notNull().default(""),
  guildId:       text("guild_id").notNull().default(""),
  coins:         integer("coins").notNull().default(0),
  bank:          integer("bank").notNull().default(0),
  reputation:    integer("reputation").notNull().default(0),
  lastDaily:     timestamp("last_daily"),
  lastWork:      timestamp("last_work"),
  lastRep:       timestamp("last_rep"),
  marriedTo:     text("married_to"),
  isAfk:         boolean("is_afk").notNull().default(false),
  afkMessage:    text("afk_message"),
  createdAt:     timestamp("created_at").notNull().default(sql`now()`),
});

export const guildSettingsTable = pgTable("guild_settings", {
  id:                 text("id").primaryKey(),
  name:               text("name").notNull(),
  iconUrl:            text("icon_url"),
  memberCount:        integer("member_count").notNull().default(0),
  prefix:             text("prefix").notNull().default("l"),
  tellonymChannelId:        text("tellonym_channel_id"),
  tellonymSendChannelId:    text("tellonym_send_channel_id"),
  tellonymApproveChannelId: text("tellonym_approve_channel_id"),
  tellonymBannerUrl:        text("tellonym_banner_url"),
  createdAt:                timestamp("created_at").notNull().default(sql`now()`),
});

export const commandLogsTable = pgTable("command_logs", {
  id:        serial("id").primaryKey(),
  userId:    text("user_id").notNull(),
  username:  text("username").notNull(),
  command:   text("command").notNull(),
  guildId:   text("guild_id").notNull(),
  guildName: text("guild_name").notNull(),
  success:   integer("success").notNull().default(1),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const duelsTable = pgTable("duels", {
  id:                  serial("id").primaryKey(),
  challengerId:        text("challenger_id").notNull(),
  challengerUsername:  text("challenger_username").notNull(),
  challengedId:        text("challenged_id").notNull(),
  challengedUsername:  text("challenged_username").notNull(),
  winnerId:            text("winner_id").notNull(),
  winnerUsername:      text("winner_username").notNull(),
  bet:                 integer("bet").notNull().default(0),
  guildId:             text("guild_id").notNull(),
  guildName:           text("guild_name").notNull(),
  createdAt:           timestamp("created_at").notNull().default(sql`now()`),
});

export const tellonymTable = pgTable("tellonym", {
  id:             serial("id").primaryKey(),
  targetUserId:   text("target_user_id").notNull(),
  targetUsername: text("target_username").notNull(),
  message:        text("message").notNull(),
  reply:          text("reply"),
  isRead:         boolean("is_read").notNull().default(false),
  status:         text("status").notNull().default("pending"),
  guildId:        text("guild_id").notNull(),
  guildName:      text("guild_name").notNull(),
  sentAt:         timestamp("sent_at").notNull().default(sql`now()`),
});

export const shopItemsTable = pgTable("shop_items", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  emoji:       text("emoji").notNull().default("🎁"),
  price:       integer("price").notNull(),
  category:    text("category").notNull().default("misc"),
  createdAt:   timestamp("created_at").notNull().default(sql`now()`),
});

export const inventoryTable = pgTable("inventory", {
  id:          serial("id").primaryKey(),
  userId:      text("user_id").notNull(),
  itemId:      integer("item_id").notNull(),
  quantity:    integer("quantity").notNull().default(1),
  equipped:    boolean("equipped").notNull().default(false),
  acquiredAt:  timestamp("acquired_at").notNull().default(sql`now()`),
});
