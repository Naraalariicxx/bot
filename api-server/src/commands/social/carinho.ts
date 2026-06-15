import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "pat",       verb: "fez carinho",      prep: "em",   emoji: "🥰" });
