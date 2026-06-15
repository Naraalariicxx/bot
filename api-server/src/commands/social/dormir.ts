import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "sleep",     verb: "está dormindo",    prep: "",     emoji: "😴" });
