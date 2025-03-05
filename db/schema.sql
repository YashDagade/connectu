-- Schema for ConnectU application
-- This file defines the database schema for the Supabase database

-- Users table (This extends the default auth.users table in Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_accepting_responses BOOLEAN DEFAULT TRUE,
  connections_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  time_limit INTEGER, -- Time limit in seconds, NULL means no limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for questions table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create responses table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Can be NULL for anonymous responses
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  summary TEXT, -- This will store the generated summary from OpenAI
  embedding_id TEXT, -- Reference to the embedding stored in Qdrant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for responses table
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create answers table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  time_spent INTEGER NOT NULL, -- Time spent answering in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for answers table
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Create connections table to store the matched pairs
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  response1_id UUID REFERENCES public.responses(id) ON DELETE CASCADE NOT NULL,
  response2_id UUID REFERENCES public.responses(id) ON DELETE CASCADE NOT NULL,
  similarity_score FLOAT NOT NULL, -- Similarity score between the two responses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Profiles: Users can read their own profile
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Forms: Owner can do everything with their forms
DROP POLICY IF EXISTS "Form owners can do everything" ON public.forms;
CREATE POLICY "Form owners can do everything"
  ON public.forms FOR ALL
  USING (auth.uid() = user_id);

-- Forms: Published forms are readable by everyone
DROP POLICY IF EXISTS "Published forms are readable by everyone" ON public.forms;
CREATE POLICY "Published forms are readable by everyone"
  ON public.forms FOR SELECT
  USING (is_published = TRUE);

-- Questions: Questions of forms are readable by everyone
DROP POLICY IF EXISTS "Questions are readable by everyone" ON public.questions;
CREATE POLICY "Questions are readable by everyone"
  ON public.questions FOR SELECT
  USING (TRUE);

-- Questions: Only form owner can modify questions
DROP POLICY IF EXISTS "Only form owner can modify questions" ON public.questions;
CREATE POLICY "Only form owner can modify questions"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Responses: Form owners can read all responses to their forms
DROP POLICY IF EXISTS "Form owners can read all responses" ON public.responses;
CREATE POLICY "Form owners can read all responses"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Responses: Users can create responses to published forms accepting responses
DROP POLICY IF EXISTS "Users can create responses to published forms" ON public.responses;
CREATE POLICY "Users can create responses to published forms"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_id
      AND forms.is_published = TRUE
      AND forms.is_accepting_responses = TRUE
    )
  );

-- Responses: Users can view their own responses
DROP POLICY IF EXISTS "Users can view their own responses" ON public.responses;
CREATE POLICY "Users can view their own responses"
  ON public.responses FOR SELECT
  USING (user_id = auth.uid());

-- Answers: Form owners can read all answers to their forms
DROP POLICY IF EXISTS "Form owners can read all answers" ON public.answers;
CREATE POLICY "Form owners can read all answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.responses
      JOIN public.forms ON responses.form_id = forms.id
      WHERE responses.id = response_id
      AND forms.user_id = auth.uid()
    )
  );

-- Answers: Users can insert answers to their own responses
DROP POLICY IF EXISTS "Users can insert answers to their own responses" ON public.answers;
CREATE POLICY "Users can insert answers to their own responses"
  ON public.answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.responses
      WHERE responses.id = response_id
      AND (responses.user_id = auth.uid() OR responses.user_id IS NULL)
    )
  );

-- Connections: Form owners can read connections for their forms
DROP POLICY IF EXISTS "Form owners can read connections" ON public.connections;
CREATE POLICY "Form owners can read connections"
  ON public.connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS forms_user_id_idx ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS questions_form_id_idx ON public.questions(form_id);
CREATE INDEX IF NOT EXISTS responses_form_id_idx ON public.responses(form_id);
CREATE INDEX IF NOT EXISTS answers_response_id_idx ON public.answers(response_id);
CREATE INDEX IF NOT EXISTS answers_question_id_idx ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS connections_form_id_idx ON public.connections(form_id); 