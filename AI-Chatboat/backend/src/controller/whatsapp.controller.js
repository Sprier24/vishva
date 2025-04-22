const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendwhatsappmessage = async (req, res) => {
  const { to, message } = req.body;

  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });

    res.status(200).json({ success: true, sid: response.sid });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  sendwhatsappmessage,
};
