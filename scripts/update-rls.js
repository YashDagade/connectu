const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateRLSPolicies() {
  try {
    console.log('Updating RLS policies to allow anonymous form submissions...');
    
    // SQL to update the response policy
    const updateResponsePolicy = `
      -- Drop the existing policy
      DROP POLICY IF EXISTS "Users can create responses to published forms" ON public.responses;
      
      -- Create a new policy that allows anonymous submissions
      CREATE POLICY "Anyone can submit responses to published forms" 
        ON public.responses FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.forms
            WHERE forms.id = form_id
            AND forms.is_published = TRUE
            AND forms.is_accepting_responses = TRUE
          )
        );
    `;
    
    // SQL to update the answers policy
    const updateAnswersPolicy = `
      -- Drop the existing policy
      DROP POLICY IF EXISTS "Users can insert answers to their own responses" ON public.answers;
      
      -- Create a new policy that allows anonymous answer submissions
      CREATE POLICY "Anyone can submit answers to their responses" 
        ON public.answers FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.responses
            WHERE responses.id = response_id
          )
        );
    `;
    
    // Execute the policies update
    console.log('Updating response policy...');
    const { error: respError } = await supabase.rpc('exec_sql', {
      query: updateResponsePolicy
    });
    
    if (respError) {
      console.error('Error updating response policy:', respError);
    } else {
      console.log('Response policy updated successfully');
    }
    
    console.log('Updating answers policy...');
    const { error: ansError } = await supabase.rpc('exec_sql', {
      query: updateAnswersPolicy
    });
    
    if (ansError) {
      console.error('Error updating answers policy:', ansError);
    } else {
      console.log('Answers policy updated successfully');
    }
    
    console.log('RLS policy updates completed');
  } catch (error) {
    console.error('Error updating RLS policies:', error);
  }
}

// Run the function
updateRLSPolicies()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 