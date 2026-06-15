const { supabase } = require('./supabaseClient');

// Test data
const CUSTOMERS = [
  { name: 'Joyce Maluki', phone: '0993127727' },
  { name: 'Mary Phiri', phone: '0884561234' },
  { name: 'Esther Banda', phone: '0998765432' },
  { name: 'Grace Chirwa', phone: '0912345678' },
  { name: 'Martha Mwale', phone: '0998761234' },
  { name: 'Ruth Nkhoma', phone: '0887654321' },
  { name: 'Sarah Kachere', phone: '0995432109' },
  { name: 'Anna Tembo', phone: '0918765432' },
  { name: 'Lucy Moyo', phone: '0992109876' },
  { name: 'Naomi Zulu', phone: '0883210987' },
  { name: 'Rebecca Chiwamba', phone: '0996543210' },
  { name: 'Hannah Banda', phone: '0910987654' },
  { name: 'Elizabeth Phiri', phone: '0997890123' },
  { name: 'Mary Chikwawa', phone: '0889012345' },
  { name: 'Dorothy Kambala', phone: '0912348765' },
];

const ITEMS = ['PJ Set', 'Dress', 'Shorts', 'Top', 'Nightie', 'Skirt', 'Blouse', 'Trousers'];
const COLOURS = ['Blue', 'Pink', 'Red', 'Green', 'Yellow', 'Black', 'White', 'Purple', 'Orange', 'Brown'];
const SIZES = ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime).toISOString().slice(0, 10);
}

async function seedData(userId) {
  console.log('Starting data seed for user:', userId);

  try {
    // Insert customers
    console.log('Inserting customers...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .insert(
        CUSTOMERS.map(c => ({
          name: c.name,
          phone: c.phone,
          owner_id: userId,
        }))
      )
      .select();

    if (customerError) {
      console.error('Error inserting customers:', customerError);
      return;
    }

    console.log(`Inserted ${customers.length} customers`);

    // Generate sales for the last 90 days
    const sales = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Generate 100-150 sales
    const numSales = randomInt(100, 150);

    for (let i = 0; i < numSales; i++) {
      const customer = randomItem(customers);
      const item = randomItem(ITEMS);
      const colour = Math.random() > 0.3 ? randomItem(COLOURS) : null; // 30% chance of no colour
      const size = randomItem(SIZES);
      const quantity = randomInt(1, 5);
      const unitPrice = randomInt(5000, 25000);
      const amount = quantity * unitPrice;
      const saleDate = randomDate(startDate, new Date());

      sales.push({
        customer_id: customer.id,
        item,
        colour,
        size,
        quantity,
        amount,
        sale_date: saleDate,
        owner_id: userId,
      });
    }

    // Insert sales in batches
    console.log('Inserting sales...');
    const batchSize = 50;
    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);
      const { error: salesError } = await supabase.from('sales').insert(batch);
      if (salesError) {
        console.error('Error inserting sales batch:', salesError);
        return;
      }
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sales.length / batchSize)}`);
    }

    console.log(`Successfully inserted ${sales.length} sales`);
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Error during seed:', error);
  }
}

// Get user ID from command line or environment
const userId = process.argv[2] || process.env.SUPABASE_USER_ID;

if (!userId) {
  console.error('Please provide a user ID as argument or set SUPABASE_USER_ID environment variable');
  console.error('Usage: node seedData.js <user_id>');
  process.exit(1);
}

seedData(userId);
