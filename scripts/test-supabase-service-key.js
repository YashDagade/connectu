// Test script to check Supabase service key connection
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment Check:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Available' : '❌ Missing');
console.log('- Service Role Key:', serviceRoleKey ? '✅ Available' : '❌ Missing');
console.log('- Anon Key:', anonKey ? '✅ Available' : '❌ Missing');

// Initialize Supabase admin client (service role)
const supabaseAdmin = createClient(
  supabaseUrl || '',
  serviceRoleKey || '',
  {
    auth: { persistSession: false }
  }
);

// Initialize Supabase anon client
const supabaseAnon = createClient(
  supabaseUrl || '',
  anonKey || '',
  {
    auth: { persistSession: false }
  }
);

async function testServiceRoleConnection() {
  console.log('\n=== Testing Service Role Access ===');
  try {
    const { data, error } = await supabaseAdmin
      .from('forms')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ Error with service role key:', error);
    } else {
      console.log('✅ Service role key works! Retrieved form data:', data);
    }
  } catch (err) {
    console.error('❌ Exception with service role key:', err);
  }
}

async function testAnonConnection() {
  console.log('\n=== Testing Anonymous Access ===');
  try {
    const { data, error } = await supabaseAnon
      .from('forms')
      .select('id, title')
      .eq('is_published', true)
      .limit(1);
    
    if (error) {
      console.error('❌ Error with anon key:', error);
    } else {
      console.log('✅ Anon key works! Retrieved form data:', data);
    }
  } catch (err) {
    console.error('❌ Exception with anon key:', err);
  }
}

// Run both tests
(async () => {
  await testServiceRoleConnection();
  await testAnonConnection();
  console.log('\nTests completed!');
})(); 