import { supabase } from './supabaseClient';

// Normalize phone numbers
function cleanPhone(phone) {
  if (!phone) return null;
  return phone.replace(/[^\d+]/g, '');
}

// Get current authenticated user's ID
async function getOwnerId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

export const api = {
  // Customers
  getCustomers: async (search = '') => {
    let query = supabase
      .from('customers')
      .select('*, sales(count)')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const customersWithCount = data.map(customer => ({
      ...customer,
      sales_count: customer.sales?.[0]?.count || 0,
      sales: undefined,
    }));

    return customersWithCount;
  },

  getCustomer: async (id) => {
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (custErr) throw new Error('Customer not found');

    const { data: sales, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', id)
      .order('sale_date', { ascending: false });

    if (salesErr) throw new Error(salesErr.message);

    return { ...customer, sales };
  },

  // Sales
  recordSale: async (sale) => {
    const {
      customerName,
      customerPhone,
      item,
      size,
      colour,
      quantity,
      unitPrice,
      saleDate,
    } = sale;

    if (!customerName || !item) {
      throw new Error('Customer name and item are required');
    }

    const owner_id = await getOwnerId(); // ← get auth user
    const phone = cleanPhone(customerPhone);

    // 1. Find existing customer by phone (preferred) or exact name match
    // Scoped to this owner only
    let customer = null;

    if (phone) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', owner_id)
        .eq('phone', phone)
        .maybeSingle();
      customer = data;
    }

    if (!customer) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', owner_id)
        .ilike('name', customerName)
        .maybeSingle();
      customer = data;
    }

    // 2. Create customer if not found
    if (!customer) {
      const { data: newCustomer, error: createErr } = await supabase
        .from('customers')
        .insert([{ owner_id, name: customerName, phone }]) // ← owner_id added
        .select()
        .single();

      if (createErr) throw new Error(createErr.message);
      customer = newCustomer;
    }

    // 3. Compute amount
    const qty = quantity ? Number(quantity) : 1;
    const price = unitPrice ? Number(unitPrice) : null;
    const finalAmount = price != null ? price * qty : null;

    // 4. Insert sale
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert([{
        owner_id,                // ← owner_id added
        customer_id: customer.id,
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

    if (saleErr) throw new Error(saleErr.message);

    return { sale: saleData, customer };
  },

  getSales: async (from, to) => {
    const toDate = to || new Date().toISOString().slice(0, 10);
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name, phone)')
      .gte('sale_date', fromDate)
      .lte('sale_date', toDate)
      .order('sale_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // Dashboard
  getDashboard: async (from, to) => {
    const toDate = to || new Date().toISOString().slice(0, 10);
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: sales, error } = await supabase
      .from('sales')
      .select('item, size, colour, quantity, amount, sale_date, customer_id, customers(name)')
      .gte('sale_date', fromDate)
      .lte('sale_date', toDate);

    if (error) throw new Error(error.message);

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

    const byDay = {};
    for (const s of sales) {
      byDay[s.sale_date] = (byDay[s.sale_date] || 0) + (Number(s.amount) || 0);
    }
    const dailyRevenue = Object.entries(byDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const customerMap = {};
    for (const s of sales) {
      const customerId = s.customer_id;
      const customerName = s.customers?.name || 'Unknown';
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          id: customerId,
          name: customerName,
          order_count: 0,
          total_spent: 0,
        };
      }
      customerMap[customerId].order_count += 1;
      customerMap[customerId].total_spent += Number(s.amount) || 0;
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    return {
      range: { from: fromDate, to: toDate },
      totalRevenue,
      totalOrders,
      totalItems,
      topItems: tally('item').slice(0, 5),
      topColours: tally('colour').slice(0, 5),
      topSizes: tally('size').slice(0, 5),
      topCustomers,
      dailyRevenue,
    };
  },
};