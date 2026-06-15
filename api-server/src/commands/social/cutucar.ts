import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "poke",      verb: "cutucou",          prep: "",     emoji: "👉" });
