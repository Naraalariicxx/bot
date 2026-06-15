import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "laugh",     verb: "está rindo",       prep: "",     emoji: "😂" });
