import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import userModel from "./src/models/user";
import connectDB from "./src/config/db";
import eventModel from "./src/models/event";
import connectOpenAI from "./src/config/openai";
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

bot.command("generate", async (ctx) => {
  const from = ctx.update.message?.from;
  if (!from) return;
  const user = await userModel.findOne({ tgId: from.id });
  if (!user) {
    await ctx.reply("Please start the bot to use it.");
    return;
  }
  const waitingMessage = await ctx.reply(
    `Hey! ${from.first_name}, I am generating the posts for you. Please wait... 🕒`
  );

  const waitingMessageId = waitingMessage.message_id;

  const loadingStickerMessage = await ctx.replyWithSticker(
    "CAACAgIAAxkBAAMUZhjxsUEZAYKWEz-qMiiLUUgJfP8AAokKAAJxbolL05dc6IwrA7A0BA"
  );

  const loadingStickerMessageId = loadingStickerMessage.message_id;
  // get events for the user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventModel.find({
    tgId: from.id.toString(),
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
  if (events.length === 0) {
    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerMessageId);
    await ctx.reply("No events found. Please add some events first.");
    return;
  }

  // make openai api call
  try {
    const openai = await connectOpenAI();
    const chatCompletion = await openai!.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "",
      messages: [
        {
          role: "system",
          content:
            "As a senior copywriter, your task is to craft highly engaging social media posts for a client. They have provided you with several events to promote, and your goal is to create captivating and creative posts for each one. Ensure that the posts are engaging and impactful. Here are the events shared by the client:",
        },
        {
          role: "user",
          content: `Write like a human, for humans: Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. Use the given time labels solely to understand the order of events; do not mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful, focusing on engaging the respective platform's audience, encouraging them to take action, and sparking conversations. The client wants the posts to be engaging and creative, and has shared the following events with you:
          ${events.map((event) => event.text).join(", ")},`,
        },
      ],

      // store token cound
    });
    await userModel.findOneAndUpdate(
      {
        tgId: from.id,
      },
      {
        $inc: {
          propmtTokens: chatCompletion.usage?.prompt_tokens,
          completionTokens: chatCompletion.usage?.completion_tokens,
        },
      }
    );

    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerMessageId);
    await ctx.reply(
      `Here are the posts for today:\n\n${chatCompletion.choices[0].message.content}`
    );
  } catch (error) {
    console.error("Error while generating posts", error);
    await ctx.reply("Something went wrong. Please try again later.");
  }
});

bot.help((ctx) =>
  ctx.reply(
    "I am here to help you with generating social media posts. Just keep feeding me with the events throught the day. To generate the posts, just enter the command: /generate \nFor support contact @amitamrutiya2210"
  )
);

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
    await eventModel.create({
      text: message,
      tgId: from.id,
    });

    await ctx.reply(
      "Noted 📝, keep texxting me your thoughts. To geenrate the posts, just enter the command: /generate"
    );
  } catch (error) {
    console.error("Error while saving event information", error);
    await ctx.reply("Something went wrong. Please try again later.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
