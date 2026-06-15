const express = require('express');
const { supabase } = require('../supabaseClient');

const router = express.Router();

// GET /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns: total revenue, total orders, top items, top colours, top sizes,
// and a per-day breakdown for the given range (default: last 7 days)
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  const toDate = to || new Date().toISOString().slice(0, 10);
  const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: sales, error } = await supabase
    .from('sales')
    .select('item, size, colour, quantity, amount, sale_date')
    .eq('owner_id', userId)
    .gte('sale_date', fromDate)
    .lte('sale_date', toDate);

  if (error) return res.status(500).json({ error: error.message });

  const tally = (key) => {
    const counts = {};
    for (const s of sales) {
      const val = s[key] || 'Unknown';
      counts[val] = (counts[val] || 0) + (s.quantity || 1);
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalOrders = sales.length;
  const totalItems = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);

  // Per-day breakdown for a simple bar chart
  const byDay = {};
  for (const s of sales) {
    byDay[s.sale_date] = (byDay[s.sale_date] || 0) + (Number(s.amount) || 0);
  }
  const dailyRevenue = Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    range: { from: fromDate, to: toDate },
    totalRevenue,
    totalOrders,
    totalItems,
    topItems: tally('item').slice(0, 5),
    topColours: tally('colour').slice(0, 5),
    topSizes: tally('size').slice(0, 5),
    dailyRevenue,
  });
});

module.exports = router;
