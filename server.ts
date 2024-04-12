import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import userModel from "./src/models/user";
import connectDB from "./src/config/db";
import eventModel from "./src/models/event";
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

bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message?.from;
  if (!from) return;
  const user = await userModel.findOne({ tgId: from.id });
  if (!user) {
    await ctx.reply("Please start the bot to use it.");
    return;
  }
  const message = ctx.update.message?.text;
  try {
  } catch (error) {
    console.error("Error while saving event information", error);
    await ctx.reply("Something went wrong. Please try again later.");
  }

  // generate the post
  await ctx.reply("Your post is ready 🚀");
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
