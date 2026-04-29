const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'PRESENT' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('Checking wellness_data table columns...');
    
    // We can't directly list columns without RPC, so we fetch one record and check keys
    const { data, error } = await supabase.from('wellness_data').select('*').limit(1);
    
    if (error) {
      console.error('Error fetching wellness_data:', error.message);
    } else {
      if (data.length > 0) {
        console.log('Columns in wellness_data:', Object.keys(data[0]));
      } else {
        console.log('No data in wellness_data to inspect columns.');
      }
    }

    console.log('\nAttempting a dry-run insert of resilience_score...');
    // Try to insert a dummy record (and we can delete it later, or just see the error)
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Likely non-existent user
      sleep_hours: 8,
      screen_time: 2,
      resilience_score: 85
    };
    
    const { error: insertError } = await supabase.from('wellness_data').insert([testData]);
    if (insertError) {
      console.log('Insert error (expected if user_id is invalid or column missing):', insertError.message);
    } else {
      console.log('Insert succeeded (column exists!)');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkTable();
