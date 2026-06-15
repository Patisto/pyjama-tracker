const express = require('express');
const { supabase } = require('../supabaseClient');

const router = express.Router();

// GET /api/customers?search=joyce
// List customers, optional search by name or phone
router.get('/', async (req, res) => {
  const { search } = req.query;
  const userId = req.user.id;

  let query = supabase
    .from('customers')
    .select('*, sales(count)')
    .eq('owner_id', userId)
    .order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  // Transform the data to include sales_count
  const customersWithCount = data.map(customer => ({
    ...customer,
    sales_count: customer.sales?.[0]?.count || 0,
    sales: undefined // Remove the nested sales object
  }));

  res.json(customersWithCount);
});

// GET /api/customers/:id  -> customer details + their sales history
router.get('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (custErr) return res.status(404).json({ error: 'Customer not found' });

  const { data: sales, error: salesErr } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', id)
    .order('sale_date', { ascending: false });

  if (salesErr) return res.status(500).json({ error: salesErr.message });

  res.json({ ...customer, sales });
});

// POST /api/customers -> create a new customer (name + phone)
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name, phone } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { data, error } = await supabase
    .from('customers')
    .insert([{ name, phone, owner_id: userId }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
