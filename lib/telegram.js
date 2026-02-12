// lib/telegram.js
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;

// Add your payment numbers here
const PAYMENT_NUMBERS = {
  bkash: "01775-352550",
  nagad: "018XXXXXXXX",
};

export async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not set');
    return false;
  }

  const chatIds = [];
  
  // Add personal chat if available
  if (TELEGRAM_CHAT_ID) {
    chatIds.push(TELEGRAM_CHAT_ID);
  }
  
  // Add group chat if available
  if (TELEGRAM_GROUP_CHAT_ID) {
    chatIds.push(TELEGRAM_GROUP_CHAT_ID);
  }

  if (chatIds.length === 0) {
    console.warn('No Telegram chat IDs configured');
    return false;
  }

  const results = [];
  
  for (const chatId of chatIds) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error(`Failed to send to chat ${chatId}:`, result);
        results.push({ chatId, success: false, error: result.description });
      } else {
        console.log(`✅ Telegram notification sent to chat ${chatId}`);
        results.push({ chatId, success: true });
      }
    } catch (error) {
      console.error(`❌ Error sending to chat ${chatId}:`, error.message);
      results.push({ chatId, success: false, error: error.message });
    }
  }

  return results;
}

// Updated formatDepositNotification with payment number
export function formatDepositNotification(user, depositData) {
  const amountInTaka = (depositData.amount / 100).toFixed(2);
  const date = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Get payment number based on method
  const paymentNumber = PAYMENT_NUMBERS[depositData.method.toLowerCase()] || 'N/A';
  
  return `
💰 <b>NEW DEPOSIT REQUEST</b> 💰

👤 <b>User ID:</b> ${user.id}
📱 <b>Method:</b> ${depositData.method.toUpperCase()}
📲 <b>Sent to:</b> <code>${paymentNumber}</code>
💵 <b>Amount:</b> ${amountInTaka} BDT
📅 <b>Time:</b> ${date}
────────────────────
🔢 <b>TRANSACTION ID:</b>
<code>${depositData.trxId}</code>
────────────────────

<i>Check admin panel for verification.</i>
  `.trim();
}

// Alternative version with better formatting
export function formatDepositNotification2(user, depositData) {
  const amountInTaka = (depositData.amount / 100).toFixed(2);
  const date = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const paymentNumber = PAYMENT_NUMBERS[depositData.method.toLowerCase()] || 'N/A';
  
  return `
🎰 <b>DEPOSIT ALERT</b>
═══════════════════════

<b>👤 USER:</b> ${user.id}
<b>📱 METHOD:</b> ${depositData.method.toUpperCase()}
<b>📲 TO NUMBER:</b> <code>${paymentNumber}</code>
<b>💰 AMOUNT:</b> ${amountInTaka} BDT
<b>⏰ TIME:</b> ${date}
═══════════════════════
<b>🎫 TRANSACTION ID:</b>
<code>${depositData.trxId}</code>
═══════════════════════

<i>Please verify in admin panel</i>
  `.trim();
}


export function formatWithdrawNotification(user, withdrawData) {
  const amountInTaka = (withdrawData.amount / 100).toFixed(2);
  const date = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return `
💸 <b>NEW WITHDRAW REQUEST</b> 💸

👤 <b>User ID:</b> ${user.id}
📱 <b>Method:</b> ${withdrawData.method.toUpperCase()}
💵 <b>Amount:</b> ${amountInTaka} BDT
📅 <b>Time:</b> ${date}
────────────────────

📲 <b>User Number:</b> <code>${withdrawData.account}</code>

  `.trim();
}

export function formatWithdrawNotification2(user, withdrawData) {
  const amountInTaka = (withdrawData.amount / 100).toFixed(2);
  const date = new Date().toLocaleTimeString();
  
  return `
🔄 <b>WITHDRAW REQUEST</b>
═══════════════════════

<b>👤 USER:</b> ${user.id}
<b>📱 METHOD:</b> ${withdrawData.method.toUpperCase()}
<b>💰 AMOUNT:</b> ${amountInTaka} BDT
<b>⏰ TIME:</b> ${date}
═══════════════════════

<b>📲 User NUMBER:</b> <code>${withdrawData.account}</code>
  `.trim();
}