import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "wink",      verb: "piscou",           prep: "para", emoji: "😉" });
