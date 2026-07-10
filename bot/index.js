require("dotenv").config();

const path = require("path");
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Inline keyboard shown UNDER the welcome photo/message
const welcomeKeyboard = Markup.inlineKeyboard([
  [Markup.button.webApp("🛍️ OPEN SHOP", process.env.MINIAPP_URL)],
  [
    Markup.button.callback("👤 Profile", "profile"),
    Markup.button.callback("📦 Orders", "orders"),
  ],
  [Markup.button.callback("💬 Support", "support")],
]);

bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    { source: path.join(__dirname, "assets", "welcome.jpg") },
    {
      caption:
`👋 Welcome to The Rawller!

Everything is available inside our Telegram Mini App.

🛍️ Browse products
📦 Track your orders
🎁 Telegram-exclusive offers

Tap the button below to start shopping.`,
      ...welcomeKeyboard,
    }
  );
});

// Inline buttons fire "callback_query" events, not "hears"
bot.action("profile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Your profile section will be available soon.");
});

bot.action("orders", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Your orders will appear here soon.");
});

bot.action("support", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Support: https://t.me/ilrawller");
});

bot.launch();

console.log("✅ The Rawller bot is running!");
