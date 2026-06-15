const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { requireAuth } = require('./supabaseClient');
const customersRouter = require('./routes/customers');
const salesRouter = require('./routes/sales');
const dashboardRouter = require('./routes/dashboard');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check (useful for Render uptime pings)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// All routes below require a valid Supabase session token
app.use('/api/customers', requireAuth, customersRouter);
app.use('/api/sales', requireAuth, salesRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
