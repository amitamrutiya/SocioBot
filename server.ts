import { Telegraf } from "telegraf";
import userModel from "./src/models/user";
import connectDB from "./src/config/db";

const bot = new Telegraf(process.env.BOT_TOKEN ?? "");
connectDB();

bot.start(async (ctx) => {
  // store the user information into db
  const from = ctx.update.message?.from;
  if (!from) return;
  try {
    await userModel.findOneAndUpdate(
      {
        tgId: from.id,
      },
      {
        $setOnInsert: {
          tgId: from.id,
          firstName: from.first_name,
          lastName: from.last_name,
          isBot: from.is_bot,
          userName: from.username,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    await ctx.reply(`
    Hey! ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you 🚀 Just keep feeding me with the events throught the day. Let's shine on social media ✨`);
  } catch (error) {
    console.error("Error while saving user information", error);
    await ctx.reply("Something went wrong. Please try again later.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
