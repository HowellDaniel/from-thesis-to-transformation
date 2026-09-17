const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user,
      pass,
    },
  });
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'from-thesis-to-transformation-rsvp' });
});

app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, email, seats } = req.body || {};

    if (!name || !email || !seats) {
      return res.status(400).json({
        ok: false,
        error: 'Name, email and seat count are required.',
      });
    }

    const recipient = process.env.EMAIL_TO;
    if (!recipient) {
      return res.status(500).json({
        ok: false,
        error: 'EMAIL_TO is not configured.',
      });
    }

    const transporter = getTransporter();
    const subject = `New book launch RSVP from ${name}`;
    const text = [
      'New RSVP submission for From Thesis to Transformation',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Seats: ${seats}`,
      '',
      'This email was sent from the book launch reservation form.',
    ].join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: recipient,
      replyTo: email,
      subject,
      text,
      html: `
        <h2>New RSVP Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Seats:</strong> ${seats}</p>
      `,
    });

    res.json({
      ok: true,
      message: 'Your RSVP was submitted successfully.',
    });
  } catch (error) {
    console.error('RSVP submission failed:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Unable to submit RSVP.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`RSVP backend running on port ${PORT}`);
});
