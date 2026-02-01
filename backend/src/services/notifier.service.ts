import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Send a Telegram message via the Bot API
 */
async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not set, skipping Telegram notification');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('Telegram API error', { status: response.status, body, chatId });
      return false;
    }

    logger.debug('Telegram message sent', { chatId });
    return true;
  } catch (error) {
    logger.error('Failed to send Telegram message', { error, chatId });
    return false;
  }
}

/**
 * Send a notification message to a user via their connected messaging platform
 */
export async function sendToUser(userId: string, text: string): Promise<boolean> {
  const app = await prisma.connectedApp.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!app) {
    logger.debug('No connected app for user, skipping notification', { userId });
    return false;
  }

  switch (app.provider) {
    case 'telegram':
      return sendTelegramMessage(app.chatId, text);
    default:
      logger.warn('Unsupported provider for notifications', { provider: app.provider, userId });
      return false;
  }
}
