async function sendPushNotifications(pushTokens, title, body, data = {}) {
  const valid = pushTokens.filter((t) => t && t.startsWith('ExponentPushToken'));
  if (valid.length === 0) return;

  const messages = valid.map((token) => ({ to: token, title, body, data, sound: 'default' }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages)
    });
  } catch (e) {
    console.error('Push notification error:', e.message);
  }
}

module.exports = { sendPushNotifications };
