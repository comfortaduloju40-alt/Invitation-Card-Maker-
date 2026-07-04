require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const {
  getSession,
  createSession,
  updateSession,
  clearSession
} = require('./sessions');
const { generateInvitationCard, generateTextCard } = require('./cardGenerator');

// Webhook mode — no polling
const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: true });

// Form steps — what to ask, where to go next, which field to save
const STEPS = {
  eventType: {
    prompt:
      `🎉 What *type of event* is this?\n\n` +
      `Reply with a number:\n` +
      `1 — 💍 Wedding\n` +
      `2 — 🎂 Birthday\n` +
      `3 — 🏢 Corporate\n` +
      `4 — 🎊 Party\n` +
      `5 — 🌿 Other`,
    next: 'eventName',
    field: 'eventType',
    required: true
  },
  eventName: {
    prompt: '📛 What is the *name or title* of the event?\n_(e.g. Sarah\'s 30th Birthday, Annual Gala 2026)_',
    next: 'hostName',
    field: 'eventName',
    required: true
  },
  hostName: {
    prompt: '👤 Who is *hosting* the event?\n_(e.g. John & Mary Smith, XYZ Corporation)_',
    next: 'guestName',
    field: 'hostName',
    required: true
  },
  guestName: {
    prompt: '🎟️ Who is this invitation for?\n_(Guest name — type *skip* to leave blank)_',
    next: 'date',
    field: 'guestName',
    required: false
  },
  date: {
    prompt: '📅 What is the *date* of the event?\n_(e.g. Saturday, 25th July 2026)_',
    next: 'time',
    field: 'date',
    required: true
  },
  time: {
    prompt: '🕐 What *time* does the event start?\n_(e.g. 6:00 PM)_',
    next: 'venue',
    field: 'time',
    required: true
  },
  venue: {
    prompt: '📍 What is the *venue or location*?\n_(e.g. The Grand Ballroom, 45 Park Lane, London)_',
    next: 'dresscode',
    field: 'venue',
    required: true
  },
  dresscode: {
    prompt: '👗 Is there a *dress code*?\n_(e.g. Black Tie, Smart Casual — type *skip* to skip)_',
    next: 'rsvp',
    field: 'dresscode',
    required: false
  },
  rsvp: {
    prompt: '📞 Any *RSVP* contact details?\n_(e.g. +1 234 567 8900 or email@example.com — type *skip* to skip)_',
    next: 'done',
    field: 'rsvp',
    required: false
  }
};

// Convert event type number to key
function parseEventType(input) {
  const map = {
    '1': 'wedding',
    '2': 'birthday',
    '3': 'corporate',
    '4': 'party',
    '5': 'other',
    'wedding': 'wedding',
    'birthday': 'birthday',
    'corporate': 'corporate',
    'party': 'party',
    'other': 'other'
  };
  return map[input.toLowerCase().trim()] || 'other';
}

// ─── /start ────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || 'there';

  bot.sendMessage(
    chatId,
    `👋 Hello, ${name}!\n\n` +
    `I'm your *Invitation Card Bot*! 🎉\n\n` +
    `I create beautiful digital invitation cards for any occasion!\n\n` +
    `*Supported Events:*\n` +
    `💍 Weddings\n` +
    `🎂 Birthdays\n` +
    `🏢 Corporate Events\n` +
    `🎊 Parties\n` +
    `🌿 Any Other Event\n\n` +
    `*Commands:*\n` +
    `🎉 /create — Make a new invitation card\n` +
    `❌ /cancel — Cancel current session\n` +
    `❓ /help — How to use this bot\n\n` +
    `Type /create to get started!`,
    { parse_mode: 'Markdown' }
  );
});

// ─── /help ─────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `❓ *How to Use Invitation Card Bot*\n\n` +
    `1. Type /create to begin\n` +
    `2. Choose your event type\n` +
    `3. Answer each question\n` +
    `4. Type *skip* for optional fields\n` +
    `5. Get a beautiful invitation card image!\n\n` +
    `*Fields I will ask for:*\n` +
    `• Event Type _(required)_\n` +
    `• Event Name _(required)_\n` +
    `• Host Name _(required)_\n` +
    `• Guest Name _(optional)_\n` +
    `• Date _(required)_\n` +
    `• Time _(required)_\n` +
    `• Venue _(required)_\n` +
    `• Dress Code _(optional)_\n` +
    `• RSVP Contact _(optional)_\n\n` +
    `Type /cancel at any time to stop.`,
    { parse_mode: 'Markdown' }
  );
});

// ─── /create ───────────────────────────────────────────
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  createSession(chatId);

  bot.sendMessage(
    chatId,
    `🎉 *Let\'s create your invitation card!*\n\n` +
    `I\'ll ask you a few quick questions.\n` +
    `Type /cancel at any time to stop.\n\n` +
    STEPS.eventType.prompt,
    { parse_mode: 'Markdown' }
  );
});

// ─── /cancel ───────────────────────────────────────────
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  clearSession(chatId);
  bot.sendMessage(
    chatId,
    '❌ Session cancelled.\n\nType /create to start a new invitation card!'
  );
});

// ─── Handle form answers ────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  const session = getSession(chatId);

  if (!session) {
    bot.sendMessage(
      chatId,
      '👋 Type /create to make an invitation card!'
    );
    return;
  }

  const currentStep = session.step;
  const stepConfig = STEPS[currentStep];
  if (!stepConfig) return;

  const isSkip = text.trim().toLowerCase() === 'skip';
  let value = isSkip && !stepConfig.required ? '' : text.trim();

  // Parse event type to a valid key
  if (currentStep === 'eventType') {
    value = parseEventType(text.trim());
  }

  // Block empty required fields
  if (stepConfig.required && !value) {
    bot.sendMessage(
      chatId,
      `⚠️ This field is required. Please enter the *${stepConfig.field}*.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  updateSession(chatId, stepConfig.next, { [stepConfig.field]: value });

  // All done — generate the card
  if (stepConfig.next === 'done') {
    const finalData = getSession(chatId).data;

    await bot.sendMessage(chatId, '⏳ Generating your invitation card...');

    try {
      // Generate image
      const imageBuffer = generateInvitationCard(finalData);

      // Send image
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: '🎉 *Your Invitation Card is Ready!*',
        parse_mode: 'Markdown'
      });

      // Send text version
      const textCard = generateTextCard(finalData);
      await bot.sendMessage(
        chatId,
        `📋 *Text Version* _(tap to copy)_\n\n${textCard}`,
        { parse_mode: 'Markdown' }
      );

      clearSession(chatId);

      await bot.sendMessage(
        chatId,
        '✅ Done! Share your invitation card with your guests!\n\nType /create to make another one.'
      );

    } catch (err) {
      console.error('Card generation error:', err.message);
      bot.sendMessage(
        chatId,
        '❌ Something went wrong. Please try /create again.'
      );
      clearSession(chatId);
    }
    return;
  }

  // Ask next question
  const nextStep = STEPS[stepConfig.next];
  if (nextStep) {
    bot.sendMessage(chatId, nextStep.prompt, { parse_mode: 'Markdown' });
  }
});

module.exports = { bot };
