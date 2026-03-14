require('dotenv').config();

const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
const avatarCreated = require('./middleware/avatarCreated');

const authRoutes = require('./routes/auth.routes');
const checkinRoutes = require('./routes/checkin.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const referralRoutes = require('./routes/referral.routes');
const shopRoutes = require('./routes/shop.routes');
const avatarRoutes = require('./routes/avatar.routes');
const battleRoutes = require('./routes/battle.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const competitionRoutes = require('./routes/competition.routes');
const gymRoutes = require('./routes/gym.routes');
const sessionRoutes = require('./routes/session.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

app.use('/api/auth', authRoutes);
app.use('/api/avatar', avatarRoutes);

app.use('/api/checkins', auth, avatarCreated, checkinRoutes);
app.use('/api/purchases', auth, avatarCreated, purchaseRoutes);
app.use('/api/referrals', auth, avatarCreated, referralRoutes);
app.use('/api/shop', auth, avatarCreated, shopRoutes);
app.use('/api/battles', auth, avatarCreated, battleRoutes);
app.use('/api/leaderboard', auth, avatarCreated, leaderboardRoutes);
app.use('/api/competitions', auth, avatarCreated, competitionRoutes);
app.use('/api/gyms', auth, gymRoutes);
app.use('/api/sessions', auth, avatarCreated, sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, data: null, error: 'Internal server error' });
});

module.exports = app;
