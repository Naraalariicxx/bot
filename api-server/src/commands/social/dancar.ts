import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "dance",     verb: "está dançando",    prep: "",     emoji: "💃" });
