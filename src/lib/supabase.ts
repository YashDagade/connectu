import { createClient } from '@supabase/supabase-js';
import { generatePersonSummary } from './openai';
import { storeResponseEmbedding, generateFormConnections } from './qdrant';

// Log Supabase initialization for debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'connectu-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Verify the client is working
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.id || 'No active session');
});

// Database schema types
export type Question = {
  id: string;
  form_id: string;
  text: string;
  order: number;
  time_limit: number | null; // Time limit in seconds, null means no limit
  created_at: string;
};

export type Form = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  is_published: boolean;
  is_accepting_responses: boolean;
  connections_generated: boolean;
  updated_at: string;
};

export type Response = {
  id: string;
  form_id: string;
  user_id: string | null; // Can be null for anonymous responses
  respondent_name: string;
  respondent_email: string;
  summary: string | null; // Generated summary of the person
  embedding_id: string | null; // Reference to the embedding in Qdrant
  created_at: string;
};

export type Answer = {
  id: string;
  response_id: string;
  question_id: string;
  text: string;
  time_spent: number; // Time spent answering in seconds
  created_at: string;
};

export type Connection = {
  id: string;
  form_id: string;
  response1_id: string;
  response2_id: string;
  similarity_score: number;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

// Auth functions

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser() {
  try {
    // First, try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      // For anonymous users, just log quietly instead of showing as an error
      console.log('No active session:', JSON.stringify(sessionError));
      return null;
    }
    
    if (sessionData?.session) {
      console.log('Session found for user:', sessionData.session.user.id);
      return sessionData.session.user;
    }
    
    // If no session, log it but don't try refreshing for anonymous users
    console.log('No active session found');
    return null;
  } catch (error) {
    console.log('Session check failed, assuming anonymous user');
    return null;
  }
}

/**
 * Gets the current user's profile
 */
export async function getCurrentUserProfile() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('getCurrentUserProfile: No authenticated user');
      return null;
    }
    
    console.log('getCurrentUserProfile: Fetching profile for user', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', JSON.stringify(error));
      
      // If the error is that the profile doesn't exist, create one
      if (error.code === 'PGRST116') {  // Record not found
        console.log('Profile not found, creating one for', user.id);
        
        // First check if we have the required fields to create a profile
        if (!user.id || !user.email) {
          console.error('Cannot create profile - missing required user data:', { 
            id: !!user.id, 
            email: !!user.email 
          });
          return null;
        }
        
        try {
          // Create a new profile record
          const newProfile = {
            id: user.id,
            email: user.email,
            display_name: user.email ? user.email.split('@')[0] : 'User'
          };
          
          console.log('Attempting to create profile with data:', { ...newProfile, id: '***' });
          
          const { data: newProfileData, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (insertError) {
            console.error('Failed to create profile - DB error:', JSON.stringify(insertError));
            throw insertError;
          }
          
          if (!newProfileData) {
            console.error('Profile creation returned no data');
            return null;
          }
          
          console.log('New profile created successfully:', newProfileData.id);
          return newProfileData as Profile;
        } catch (createErr) {
          console.error('Failed to create profile - exception:', createErr instanceof Error ? createErr.message : createErr);
          return null;
        }
      } else {
        // Some other database error occurred
        console.error('Database error when getting profile:', error.code, error.message);
        return null;
      }
    }
    
    console.log('Profile found:', data?.display_name || data?.email || 'No name');
    return data as Profile;
  } catch (error) {
    console.error('Unexpected error in getCurrentUserProfile:', error instanceof Error ? error.message : JSON.stringify(error));
    return null;
  }
}

/**
 * Creates or updates a user profile
 */
export async function upsertUserProfile(profile: Partial<Profile>) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot upsert profile: Not authenticated');
      throw new Error('Not authenticated');
    }
    
    if (!user.id || !user.email) {
      console.error('Cannot upsert profile: Missing user data', { id: !!user.id, email: !!user.email });
      throw new Error('Missing required user data (id or email)');
    }
    
    console.log('Upserting profile for user:', user.id);
    
    const profileData = {
      id: user.id,
      email: user.email,
      ...profile,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting profile:', JSON.stringify(error));
      throw error;
    }
    
    console.log('Profile upsert successful for user:', user.id);
    return data as Profile;
  } catch (error) {
    console.error('Failed to upsert profile:', error instanceof Error ? error.message : JSON.stringify(error));
    throw error;
  }
}

// Form functions

/**
 * Creates a new form
 */
export async function createForm(userId: string, title: string, description: string) {
  const { data, error } = await supabase
    .from('forms')
    .insert({
      user_id: userId,
      title,
      description,
      is_published: false,
      is_accepting_responses: true,
      connections_generated: false
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Adds questions to a form
 */
export async function addQuestionsToForm(formId: string, questions: Array<{ text: string, time_limit: number | null, order: number }>) {
  const { data, error } = await supabase
    .from('questions')
    .insert(
      questions.map(q => ({
        form_id: formId,
        text: q.text,
        time_limit: q.time_limit,
        order: q.order
      }))
    )
    .select();
  
  if (error) throw error;
  return data;
}

/**
 * Updates a form's publish status
 */
export async function publishForm(formId: string) {
  const { data, error } = await supabase
    .from('forms')
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq('id', formId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Updates a form's response acceptance status
 */
export async function stopAcceptingResponses(formId: string) {
  const { data, error } = await supabase
    .from('forms')
    .update({ 
      is_accepting_responses: false, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', formId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Gets a form by ID
 */
export async function getFormById(formId: string) {
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();
  
  if (formError) throw formError;
  
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('form_id', formId)
    .order('order', { ascending: true });
  
  if (questionsError) throw questionsError;
  
  return { form, questions };
}

/**
 * Creates a new response
 */
export async function createResponse(formId: string, userId: string | null, name: string, email: string) {
  const { data, error } = await supabase
    .from('responses')
    .insert({
      form_id: formId,
      user_id: userId,
      respondent_name: name,
      respondent_email: email
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Submits answers for a response
 */
export async function submitAnswers(responseId: string, answers: Array<{ question_id: string, text: string, time_spent: number }>) {
  const { data, error } = await supabase
    .from('answers')
    .insert(
      answers.map(a => ({
        response_id: responseId,
        question_id: a.question_id,
        text: a.text,
        time_spent: a.time_spent
      }))
    )
    .select();
  
  if (error) throw error;
  return data;
}

/**
 * Gets responses for a form
 */
export async function getFormResponses(formId: string) {
  const { data: responses, error: responsesError } = await supabase
    .from('responses')
    .select('*')
    .eq('form_id', formId);
  
  if (responsesError) throw responsesError;
  
  const responseIds = responses.map(r => r.id);
  
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .in('response_id', responseIds);
  
  if (answersError) throw answersError;
  
  return { responses, answers };
}

/**
 * Gets all forms created by a user
 */
export async function getUserForms(userId?: string) {
  // If no userId is provided, get current authenticated user
  let currentUserId = userId;
  
  if (!currentUserId) {
    const user = await getCurrentUser();
    currentUserId = user?.id;
    
    // If still no user, return empty array (for development/testing)
    if (!currentUserId) {
      console.warn('No user ID provided or found in auth session');
      return [];
    }
  }

  // Get all forms for this user
  const { data: forms, error } = await supabase
    .from('forms')
    .select(`
      *,
      responses:responses(count)
    `)
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Process the count from the Postgres aggregation
  return forms.map(form => ({
    ...form,
    responses_count: form.responses?.length || 0,
    responses: undefined // Remove the responses object to clean up the data
  }));
}

/**
 * Deletes a form and all related data
 */
export async function deleteForm(formId: string) {
  // First, get all responses to this form
  const { data: responses } = await supabase
    .from('responses')
    .select('id')
    .eq('form_id', formId);
  
  const responseIds = responses?.map(r => r.id) || [];
  
  // Delete in correct order to maintain referential integrity
  if (responseIds.length > 0) {
    // Delete answers linked to these responses
    const { error: answersError } = await supabase
      .from('answers')
      .delete()
      .in('response_id', responseIds);
    
    if (answersError) throw answersError;
    
    // Delete responses
    const { error: responsesError } = await supabase
      .from('responses')
      .delete()
      .eq('form_id', formId);
    
    if (responsesError) throw responsesError;
  }
  
  // Delete connections for this form
  const { error: connectionsError } = await supabase
    .from('connections')
    .delete()
    .eq('form_id', formId);
  
  if (connectionsError) throw connectionsError;
  
  // Delete questions for this form
  const { error: questionsError } = await supabase
    .from('questions')
    .delete()
    .eq('form_id', formId);
  
  if (questionsError) throw questionsError;
  
  // Finally, delete the form itself
  const { error: formError } = await supabase
    .from('forms')
    .delete()
    .eq('id', formId);
  
  if (formError) throw formError;
  
  return true;
}

/**
 * Updates a form's details
 */
export async function updateForm(formId: string, updates: { title?: string; description?: string }) {
  const { data, error } = await supabase
    .from('forms')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', formId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Updates a question's details
 */
export async function updateQuestion(questionId: string, updates: { text?: string; time_limit?: number | null; order?: number }) {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Deletes a question
 */
export async function deleteQuestion(questionId: string) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);
  
  if (error) throw error;
  return true;
}

/**
 * Processes form responses to generate summaries and embeddings
 */
export async function processFormResponses(formId: string) {
  try {
    // Get the form details
    const { form, questions } = await getFormById(formId);
    
    // Get all responses for this form that don't have summaries yet
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .is('summary', null);
    
    if (responsesError) throw responsesError;
    
    if (!responses.length) {
      console.log('No responses to process for form', formId);
      return [];
    }
    
    // Get all answers for these responses
    const responseIds = responses.map(r => r.id);
    const { data: allAnswers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('response_id', responseIds);
    
    if (answersError) throw answersError;
    
    // Process each response
    const processedResponses = await Promise.all(
      responses.map(async (response) => {
        // Get this response's answers
        const responseAnswers = allAnswers.filter(a => a.response_id === response.id);
        
        // Create a map of question ID to answer text
        const answerMap: Record<string, string> = {};
        responseAnswers.forEach(answer => {
          answerMap[answer.question_id] = answer.text;
        });
        
        // Generate summary using OpenAI
        const summary = await generatePersonSummary(
          form.title,
          form.description || '',
          questions.map(q => ({ id: q.id, text: q.text })),
          answerMap,
          response.respondent_name
        );
        
        // Store the embedding in Qdrant
        const embeddingId = await storeResponseEmbedding(
          {
            formId: form.id,
            responseId: response.id,
            respondentName: response.respondent_name,
            respondentEmail: response.respondent_email,
            summary
          },
          summary
        );
        
        // Update the response in Supabase with the summary and embedding ID
        const { data: updatedResponse, error: updateError } = await supabase
          .from('responses')
          .update({
            summary,
            embedding_id: embeddingId
          })
          .eq('id', response.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        return updatedResponse;
      })
    );
    
    return processedResponses;
  } catch (error) {
    console.error('Error processing form responses:', error);
    throw error;
  }
}

/**
 * Generates and stores connections between form responses
 */
export async function generateAndStoreConnections(formId: string) {
  try {
    // Generate connections using Qdrant
    const connections = await generateFormConnections(formId);
    
    if (!connections.length) {
      console.log('No connections generated for form', formId);
      return [];
    }
    
    // Store connections in Supabase
    const { data: storedConnections, error } = await supabase
      .from('connections')
      .insert(
        connections.map(conn => ({
          form_id: formId,
          response1_id: conn.response1Id,
          response2_id: conn.response2Id,
          similarity_score: conn.similarityScore
        }))
      )
      .select();
    
    if (error) throw error;
    
    // Update the form to mark connections as generated
    await supabase
      .from('forms')
      .update({
        connections_generated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId);
    
    return storedConnections;
  } catch (error) {
    console.error('Error generating and storing connections:', error);
    throw error;
  }
}

/**
 * Gets all connections for a form
 */
export async function getFormConnections(formId: string) {
  try {
    // Get all connections for this form
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('form_id', formId)
      .order('similarity_score', { ascending: false });
    
    if (connectionsError) throw connectionsError;
    
    if (!connections.length) {
      return [];
    }
    
    // Get response details for all responses in these connections
    const responseIds = new Set<string>();
    connections.forEach(conn => {
      responseIds.add(conn.response1_id);
      responseIds.add(conn.response2_id);
    });
    
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('id, respondent_name, respondent_email, summary')
      .in('id', Array.from(responseIds));
    
    if (responsesError) throw responsesError;
    
    // Create a map of response ID to response data
    const responseMap = new Map();
    responses.forEach(resp => {
      responseMap.set(resp.id, resp);
    });
    
    // Enrich the connections with response data
    return connections.map(conn => ({
      ...conn,
      response1: responseMap.get(conn.response1_id),
      response2: responseMap.get(conn.response2_id)
    }));
  } catch (error) {
    console.error('Error getting form connections:', error);
    throw error;
  }
} 