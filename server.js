const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const EVENT_CONTEXT = {
  title: 'From Thesis to Transformation',
  author: 'Felicia Awura Ama Twumwaa Odei Benefo',
  date: '27 November 2026',
  time: '5:00 PM',
  venue: 'AH Hotel',
  phone: '+233 53 609 0597',
  email: process.env.EMAIL_TO || 'amaodeibenefo@gmail.com',
};

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
    auth: { user, pass },
  });
}

function answerAssistant(question) {
  const q = String(question || '').trim().toLowerCase();
  if (!q) return 'Please type a question about the book, author, launch, venue, reservations or contact details.';

  if (/hello|hi|hey|good morning|good afternoon|good evening|help/.test(q)) {
    return 'Welcome. I can help with the book, the author, the launch date and time, the venue, reservations, accessibility questions and contact details.';
  }
  if (/book|thesis|transformation|read|about|content|topic/.test(q)) {
    return `${EVENT_CONTEXT.title} is a practical guide to turning academic research into publication, influence, visibility, opportunity and impact.`;
  }
  if (/author|felicia|benefo|writer|speaker|who wrote/.test(q)) {
    return `${EVENT_CONTEXT.author} is an accounting scholar, researcher, entrepreneur and emerging academic professional pursuing a PhD in Accounting.`;
  }
  if (/date|when|time|schedule|day|november/.test(q)) {
    return `The official launch is on ${EVENT_CONTEXT.date} at ${EVENT_CONTEXT.time}.`;
  }
  if (/venue|where|location|hotel|address|direction|map/.test(q)) {
    return `The launch will be held at ${EVENT_CONTEXT.venue}. For directions or assistance, call ${EVENT_CONTEXT.phone}.`;
  }
  if (/rsvp|reserve|seat|ticket|register|attend|entry|cost|price|fee/.test(q)) {
    return `Use the reservation form on the website. The seat selector begins at 50. Reservations are free, and successful submissions are sent to the organiser.`;
  }
  if (/contact|call|phone|email|organiser|organizer|reach|support|whatsapp/.test(q)) {
    return `You can contact the organiser at ${EVENT_CONTEXT.phone} or ${EVENT_CONTEXT.email}.`;
  }
  if (/access|accessible|disability|wheelchair|parking|child|children|dress|food|refreshment/.test(q)) {
    return `For event-specific arrangements, please contact the organiser at ${EVENT_CONTEXT.phone} or ${EVENT_CONTEXT.email} so your request can be handled personally.`;
  }
  return `I can help with questions about ${EVENT_CONTEXT.title}, the author, the launch date and venue, reservations, accessibility arrangements or contact details. Please ask one of those questions.`;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'from-thesis-to-transformation-rsvp' });
});

app.post('/api/assistant', (req, res) => {
  const { question } = req.body || {};
  if (typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'A question is required.' });
  }
  if (question.length > 500) {
    return res.status(400).json({ ok: false, error: 'Please keep your question under 500 characters.' });
  }
  res.json({ ok: true, answer: answerAssistant(question.trim()) });
});

app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, email, seats } = req.body || {};

    if (!name || !email || !seats) {
      return res.status(400).json({ ok: false, error: 'Name, email and seat count are required.' });
    }

    const seatCount = Number(seats);
    if (!Number.isInteger(seatCount) || seatCount < 50 || seatCount > 60) {
      return res.status(400).json({ ok: false, error: 'Seat count must be between 50 and 60.' });
    }

    const recipient = process.env.EMAIL_TO;
    if (!recipient) {
      return res.status(500).json({ ok: false, error: 'EMAIL_TO is not configured.' });
    }

    const transporter = getTransporter();
    const subject = `New book launch RSVP from ${name}`;
    const text = [
      'New RSVP submission for From Thesis to Transformation',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Seats: ${seatCount}`,
      '',
      'This email was sent from the book launch reservation form.',
    ].join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: recipient,
      replyTo: email,
      subject,
      text,
      html: `<h2>New RSVP Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Seats:</strong> ${seatCount}</p>`,
    });

    res.json({ ok: true, message: 'Your RSVP was submitted successfully.' });
  } catch (error) {
    console.error('RSVP submission failed:', error);
    res.status(500).json({ ok: false, error: error.message || 'Unable to submit RSVP.' });
  }
});

app.listen(PORT, () => {
  console.log(`RSVP backend running on port ${PORT}`);
});
