# therawller Telegram Mini App — Complete Setup Guide

---

## WHAT YOU'RE BUILDING
A Telegram Mini App (runs inside Telegram) with:
- Dark gold-themed shop UI
- Product catalog with gram-based pricing
- Cart + checkout (InPost, UPS, Delivery Piemonte)
- Crypto / IBAN payment selection
- Auto-sends order details to your Telegram group
- Profile, orders history, support
- Everything editable from one config file

---

## STEP 1: Install Prerequisites

Open your terminal on Elementary OS:

```bash
# Install Node.js (v20 recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # should show v20.x.x
npm --version    # should show 10.x.x
```

---

## STEP 2: Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: e.g. `therawller pv`
4. Choose a username: e.g. `therawller_pv_bot`
5. **Copy the API token** — you'll need it (looks like `7123456789:AAHxxx...`)

Then set the bot's menu button:
1. In BotFather send `/mybots` → select your bot
2. → Bot Settings → Menu Button
3. Set URL to your deployed app URL (you'll get this in Step 6)

---

## STEP 3: Get Your Orders Group Chat ID

1. Create a Telegram group (or use an existing one)
2. Add your bot to the group as **admin** (so it can post messages)
3. Add **@userinfobot** to the group — it will reply with the group's Chat ID
   - It looks like `-1001234567890` (starts with `-100`)
4. Remove @userinfobot from the group
5. **Copy the Chat ID**

---

## STEP 4: Set Up the Project

```bash
# Navigate to where you want the project
cd ~/Projects   # or wherever you keep code

# Copy the therawller-miniapp folder here, then:
cd therawller-miniapp

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Open `.env` in VS Code:
```
VITE_BOT_TOKEN=7123456789:AAHxxx...your_token_here
VITE_ORDER_CHAT_ID=-1001234567890
```

---

## STEP 5: Customize Your App

**All customization is in `src/config.js`** — open it in VS Code.

### Change shop name / logo:
```js
export const SHOP_CONFIG = {
  name: "YOUR SHOP NAME",     // ← change this
  subtitle: "mini app",
  logo: "/logo.png",          // ← put your logo in /public/logo.png
  background: "/bg.jpg",      // ← put your art in /public/bg.jpg
  ...
};
```

### Add/edit products:
```js
export const PRODUCTS = [
  {
    id: "my_product",           // unique ID, no spaces
    name: "My Product Name",
    brand: "MY BRAND",          // or null
    emoji: "🔥",
    description: "Description here",
    image: "/products/my_product.jpg",  // put image in /public/products/
    minQty: 10,
    strains: ["OG Kush", "Gelato"],     // or null
    prices: [
      { grams: 10, price: 90 },
      { grams: 25, price: 200 },
      { grams: 50, price: 380 },
      // add as many tiers as you want
    ],
  },
  // ... more products
];
```

### Add product images:
- Place images in `/public/products/`
- Name them to match the `image:` field in config
- Recommended: square images, 600×600px minimum
- Formats: JPG or PNG

### Change support / channel links:
```js
export const LINKS = [
  { label: "Chat assistenza", icon: "💬", url: "https://t.me/your_username" },
  { label: "Canale", icon: "📢", url: "https://t.me/your_channel" },
];
```

---

## STEP 6: Test Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Note:** Telegram-specific features (user data, haptics) only work inside Telegram.
> But you can test the full UI in the browser.

---

## STEP 7: Deploy (Netlify — Free & Fast)

Netlify is the easiest and fastest option. Free tier is plenty.

### Option A: Netlify (recommended — easiest)

1. Go to **netlify.com** and sign up (free)
2. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify login
   ```
3. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```
4. You'll get a URL like `https://therawller.netlify.app`
5. **Set environment variables on Netlify:**
   - Go to Site Settings → Environment Variables
   - Add `VITE_BOT_TOKEN` and `VITE_ORDER_CHAT_ID`
   - Redeploy: `netlify deploy --prod --dir=dist`

### Option B: GitHub Pages (also free)

```bash
npm install -g gh-pages
npm run build
gh-pages -d dist
```

### Option C: VPS / Your own server (most secure)
If you have a VPS:
```bash
npm run build
# Upload /dist folder via FTP/SCP to your server
# Serve with nginx pointing to /dist
```

---

## STEP 8: Connect Bot to Your App

1. In **BotFather**: `/mybots` → your bot → Bot Settings → Menu Button
2. Set the URL to your Netlify URL: `https://therawller.netlify.app`
3. Set button text to: `Shop` (or whatever you want)

Then also configure the Mini App:
1. BotFather → `/mybots` → your bot → Bot Settings → **Configure Mini App**
2. Enable Mini App → set URL to your deployed URL
3. You can also link it with `/setmenubutton`

---

## STEP 9: Push to Git (optional but recommended)

```bash
git init
git add .
git commit -m "initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/yourusername/therawller-miniapp.git
git push -u origin main
```

> ⚠️ **NEVER push your `.env` file** — it contains your bot token.
> `.gitignore` already excludes it.

---

## HOW ORDERS LOOK IN YOUR GROUP

When someone places an order, your group gets:

```
🛒 NUOVO ORDINE — therawller

👤 Cliente:
  Nome: Marco Rossi
  Username: @marcorossi
  ID: 123456789

📦 Prodotti:
  • Plasma Static ❄️ [Strain A] — 200g

🚚 Consegna: Ship (InPost)
📍 Indirizzo:
  nome: Marco
  cognome: Rossi
  telefono: +39 333 1234567
  locker_name: TO-CENTRO-001
  locker_address: Via Roma 1, pv
  email: marco@email.com

💳 Pagamento: Crypto
📝 Note: Chiamami prima della spedizione

💰 TOTALE: €1800
```

---

## SECURITY TIPS

### Must do:
- ✅ Never expose your `.env` — use Netlify's env vars UI
- ✅ Add your bot to the group as admin (otherwise it can't post)
- ✅ Keep your bot token secret — never put it in code or GitHub

### Extra security (optional but good):
- Add a **Telegram user whitelist** in config to only allow known users
- Verify `initData` server-side using a backend (Node.js/Python) to ensure
  orders truly come from Telegram users (prevents fake orders)
- Use a **backend proxy** (e.g. Cloudflare Worker) so your bot token
  is never exposed in frontend code at all

### Fastest setup for speed:
- **Netlify CDN** serves your app from edge servers globally — fastest option
- Keep images optimized (use WebP, compress JPGs under 200KB)
- Lazy-load product images (already done in the code)

---

## FILE STRUCTURE

```
therawller-miniapp/
├── public/
│   ├── logo.png          ← Your shop logo
│   ├── bg.jpg            ← Background art
│   └── products/
│       ├── plasma_static.jpg
│       └── frozen_premium.jpg
├── src/
│   ├── config.js         ← ⭐ EDIT EVERYTHING HERE
│   ├── store.js          ← Cart state management
│   ├── index.css         ← All styles
│   ├── App.jsx           ← Main app + routing
│   ├── main.jsx          ← Entry point
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   └── Topbar.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ShopPage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── SupportPage.jsx
│   │   └── ProfilePage.jsx
│   └── utils/
│       └── telegram.js   ← Order notification sender
├── .env                  ← Your secrets (never commit!)
├── .env.example          ← Template (safe to commit)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## COMMON ISSUES

**"Bot can't send messages to group"**
→ Make sure the bot is added as **admin** to the group

**"Telegram user data not showing"**
→ Normal when testing in browser — only works inside Telegram

**"Images not loading"**
→ Check that image filenames in config.js exactly match files in /public/products/

**"Order not sending"**
→ Check your .env has the correct token and chat ID
→ Check that VITE_ prefix is on both variable names

---

## QUICK COMMAND REFERENCE

```bash
npm run dev        # Start local dev server
npm run build      # Build for production
netlify deploy --prod --dir=dist   # Deploy to Netlify
```
