import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "think",     verb: "está pensando",    prep: "",     emoji: "🤔" });
