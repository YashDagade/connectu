import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get environment variables with proper checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// More detailed logging for debugging environment issues
console.log('API Route Environment Check:', { 
  supabaseUrlDefined: !!supabaseUrl,
  serviceRoleKeyDefined: !!serviceRoleKey,
  anonKeyDefined: !!anonKey
});

// Initialize Supabase clients
// Primary client with service role key (admin privileges)
const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: { persistSession: false }
  }
) : null;

// Fallback client with anon key
const supabaseFallback = supabaseUrl && anonKey ? createClient(
  supabaseUrl,
  anonKey,
  {
    auth: { persistSession: false }
  }
) : null;

// Function to test if supabaseAdmin is working
async function isServiceRoleWorking() {
  if (!supabaseAdmin) return false;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('forms')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Service role key test failed:', error);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!supabaseUrl) {
      console.error('Missing Supabase URL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing database URL' },
        { status: 500 }
      );
    }

    if (!supabaseAdmin && !supabaseFallback) {
      console.error('Neither service role nor anon key available');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API keys' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { formId, name, email, answers } = data;
    
    console.log('Form submission request received:', { 
      formId, 
      name, 
      email: email ? '✓ Provided' : '✗ Missing', 
      answerCount: answers?.length || 0
    });
    
    if (!formId || !name || !email || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Missing required fields for form submission' },
        { status: 400 }
      );
    }
    
    // Determine which client to use
    let supabase;
    
    // First try to use admin if available
    if (supabaseAdmin && await isServiceRoleWorking()) {
      console.log('Using service role key for submission');
      supabase = supabaseAdmin;
    } 
    // Fallback to anon key if admin isn't working
    else if (supabaseFallback) {
      console.log('Falling back to anon key for submission');
      supabase = supabaseFallback;
    } 
    // No working client available
    else {
      console.error('No working Supabase client available');
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }
    
    // Check if the form exists and is accepting responses
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('is_accepting_responses, is_published')
      .eq('id', formId)
      .single();
    
    if (formError) {
      console.error('Form check error:', formError);
      return NextResponse.json(
        { error: `Form not found or unavailable: ${formError.message}` },
        { status: 404 }
      );
    }
    
    if (!formData.is_published) {
      return NextResponse.json(
        { error: 'This form is not published' },
        { status: 403 }
      );
    }
    
    if (!formData.is_accepting_responses) {
      return NextResponse.json(
        { error: 'This form is no longer accepting responses' },
        { status: 403 }
      );
    }
    
    // Create the response
    console.log('Creating response record for form:', formId);
    const { data: responseData, error: responseError } = await supabase
      .from('responses')
      .insert({
        form_id: formId,
        user_id: null, // Anonymous submission
        respondent_name: name,
        respondent_email: email
      })
      .select()
      .single();
    
    if (responseError) {
      console.error('Response creation error:', responseError);
      return NextResponse.json(
        { error: `Failed to create response: ${responseError.message}` },
        { status: 500 }
      );
    }
    
    console.log('Response record created successfully:', responseData.id);
    
    // Format the answers for submission
    const formattedAnswers = answers.map(answer => ({
      response_id: responseData.id,
      question_id: answer.question_id,
      text: answer.text,
      time_spent: answer.time_spent || 0
    }));
    
    // Submit the answers
    console.log(`Submitting ${formattedAnswers.length} answers for response:`, responseData.id);
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .insert(formattedAnswers)
      .select();
    
    if (answersError) {
      console.error('Answer submission error:', answersError);
      return NextResponse.json(
        { error: `Failed to submit answers: ${answersError.message}` },
        { status: 500 }
      );
    }
    
    console.log('All answers submitted successfully:', answersData.length);
    
    return NextResponse.json({
      success: true,
      responseId: responseData.id,
      answerCount: answersData.length
    });
    
  } catch (error) {
    console.error('Server-side form submission error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Submission error: ${error.message}` 
          : 'An unknown server error occurred during submission' 
      },
      { status: 500 }
    );
  }
} 