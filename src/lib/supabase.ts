import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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
  updated_at: string;
};

export type Response = {
  id: string;
  form_id: string;
  user_id: string | null; // Can be null for anonymous responses
  respondent_name: string;
  respondent_email: string;
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

// Database functions

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
      is_published: false
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
    const { data: { user } } = await supabase.auth.getUser();
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
  
  // Delete questions
  const { error: questionsError } = await supabase
    .from('questions')
    .delete()
    .eq('form_id', formId);
  
  if (questionsError) throw questionsError;
  
  // Finally delete the form
  const { error: formError } = await supabase
    .from('forms')
    .delete()
    .eq('id', formId);
  
  if (formError) throw formError;
  
  return true;
}

/**
 * Updates form details
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
 * Updates a question
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