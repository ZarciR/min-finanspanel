import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Hämta tillåtna e-postadresser från miljövariabel, kommaseparerat
const allowedEmails = process.env.ALLOWED_EMAIL
  ? process.env.ALLOWED_EMAIL.split(',').map(email => email.trim())
  : [];

app.use(session({
  secret: process.env.SESSION_SECRET || 'hemlig-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://min-finanspanel.onrender.com/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails && profile.emails[0].value;
  if (allowedEmails.includes(email)) {
    return done(null, profile);
    loadAssets();
  }
  return done(null, false, { message: 'Du har inte behörighet.' });
}));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/no-access' }),
  (req, res) => {
    res.send(`Hej ${req.user.displayName}, du är inloggad!`);
    
  }
);

app.get('/no-access', (req, res) => {
  res.send('Du har inte behörighet att logga in.');
});

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Logga in med Google</a>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servern körs på port ${PORT}`);
});

async function loadAssets() {
  const res = await fetch('/assets');
  const data = await res.json();

  const tbody = document.getElementById('assets-table');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.kategori}</td><td>${row.värde}</td>`;
    tbody.appendChild(tr);
  });
}
