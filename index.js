bot.start(async (ctx) => {

    await ctx.replyWithPhoto(
        {
            source: "./assets/welcome.jpg"
        },
        {
            caption:
`👋 Welcome to The Rawller!

Everything is available inside our Telegram Mini App.

🛍️ Browse products
📦 Track your orders
🎁 Telegram-exclusive offers

Tap the button below to start shopping.`,
            reply_markup: keyboard.reply_markup
        }
    );

});
