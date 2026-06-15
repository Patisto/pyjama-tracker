const express = require('express');
const { supabase } = require('../supabaseClient');

const router = express.Router();

// Normalize phone numbers so "099 312 7727" and "0993127727" match the same customer.
// If it's a WhatsApp-style number we still store the digits but expose a wa.me link
// for the frontend to render a clickable WhatsApp button.
function cleanPhone(phone) {
  if (!phone) return null;
  return phone.replace(/[^\d+]/g, '');
}

// POST /api/sales
// body: { customerName, customerPhone, item, size, colour, quantity, unitPrice, amount, saleDate }
// Finds or creates the customer by phone (or name if no phone), then inserts the sale.
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const {
    customerName,
    customerPhone,
    item,
    size,
    colour,
    quantity,
    unitPrice,
    amount,
    saleDate,
  } = req.body;

  if (!customerName || !item) {
    return res.status(400).json({ error: 'Customer name and item are required' });
  }

  const phone = cleanPhone(customerPhone);

  // 1. Find existing customer by phone (preferred) or exact name match
  let customer = null;

  if (phone) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('owner_id', userId)
      .eq('phone', phone)
      .maybeSingle();
    customer = data;
  }

  if (!customer) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('owner_id', userId)
      .ilike('name', customerName)
      .maybeSingle();
    customer = data;
  }

  // 2. Create customer if not found
  if (!customer) {
    const { data: newCustomer, error: createErr } = await supabase
      .from('customers')
      .insert([{ name: customerName, phone, owner_id: userId }])
      .select()
      .single();

    if (createErr) return res.status(500).json({ error: createErr.message });
    customer = newCustomer;
  }

  // 3. Compute amount if not provided but unitPrice + quantity are
  const qty = quantity ? Number(quantity) : 1;
  const price = unitPrice ? Number(unitPrice) : null;
  const finalAmount = amount != null ? Number(amount) : (price != null ? price * qty : null);

  // 4. Insert sale
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .insert([{
      customer_id: customer.id,
      owner_id: userId,
      item,
      size,
      colour,
      quantity: qty,
      unit_price: price,
      amount: finalAmount,
      sale_date: saleDate || new Date().toISOString().slice(0, 10),
    }])
    .select()
    .single();

  if (saleErr) return res.status(500).json({ error: saleErr.message });

  res.status(201).json({ sale, customer });
});

// GET /api/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
// List sales in a date range (default: last 7 days), joined with customer name/phone
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  const toDate = to || new Date().toISOString().slice(0, 10);
  const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('sales')
    .select('*, customers(name, phone)')
    .eq('owner_id', userId)
    .gte('sale_date', fromDate)
    .lte('sale_date', toDate)
    .order('sale_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
