const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'hemlig-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // sätt till true om du kör HTTPS (Render hanterar ofta HTTPS ändå)
    maxAge: 24 * 60 * 60 * 1000 // 1 dag
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
  return done(null, profile);
}));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`Hej ${req.user.displayName}, du är inloggad!`);
  });

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Logga in med Google</a>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servern körs på port ${PORT}`);
});

async function handleCredentialResponse(response) {
  const idToken = response.credential;
  const res = await fetch('/verify-token', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ idToken }),
  });
  const result = await res.json();

  if (result.success) {
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("login").style.display = "none";
  } else {
    alert("Du har inte behörighet.");
  }
}
