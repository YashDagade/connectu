# ConnectU - Backend Engineering Documentation

This comprehensive technical documentation provides a detailed overview of the ConnectU application architecture, focusing on the backend components, database structure, API endpoints, and service integrations. This guide is intended for backend engineers who need to understand, develop, or maintain the system.

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Environment Setup](#environment-setup)
4. [Database Architecture](#database-architecture)
5. [Core Services](#core-services)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Vector Database Integration](#vector-database-integration)
9. [AI Integration](#ai-integration)
10. [Deployment](#deployment)
11. [Development Workflow](#development-workflow)

## System Overview

ConnectU is a web application that allows users to create custom forms, collect responses, and establish connections between respondents based on the similarity of their answers. The system uses AI (OpenAI) to generate summaries of responses and vector embeddings to find similarities between respondents.

### Key Capabilities
- Form creation and management
- Question configuration with optional time limits
- Response collection
- AI-powered response summarization
- Vector-based similarity matching
- Connection generation and visualization

### Key Flows
1. **Form Creation**: Users create forms with custom questions
2. **Response Collection**: Users share forms to collect responses
3. **Processing**: System generates summaries and embeddings for responses
4. **Connection Generation**: System identifies similar responses and creates connections
5. **Connection Viewing**: Users view and manage connections

## Technology Stack

### Backend
- **Framework**: Next.js 15 (App Router) - Server Components & API Routes
- **Database**: PostgreSQL (via Supabase)
- **Vector Database**: Qdrant
- **AI Models**: OpenAI (GPT-4o and text-embedding-3-large)
- **Authentication**: Supabase Auth

### Core Libraries
- **Supabase Client**: `@supabase/supabase-js` (v2.49.1)
- **Qdrant Client**: `@qdrant/js-client-rest` (v1.13.0)
- **OpenAI Client**: `openai` (v4.85.4)
- **UUID Generation**: `uuid` (v11.1.0)

## Environment Setup

### Required Environment Variables
```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Qdrant Configuration
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

### Local Development Setup
1. Clone the repository
2. Create a `.env.local` file with the environment variables above
3. Install dependencies: `npm install`
4. Apply database schema: `npm run apply-schema`
5. Run development server: `npm run dev`

## Database Architecture

ConnectU uses a PostgreSQL database managed through Supabase, with the following tables:

### Core Tables

#### `profiles`
Extends Supabase Auth user profiles:
- `id` - UUID reference to auth.users(id)
- `email` - User's email
- `display_name` - User's display name
- `avatar_url` - User's avatar URL
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

#### `forms`
Stores form definitions:
- `id` - UUID primary key
- `user_id` - UUID reference to auth.users(id)
- `title` - Form title
- `description` - Form description
- `is_published` - Boolean indicating if form is published
- `is_accepting_responses` - Boolean indicating if form is accepting responses
- `connections_generated` - Boolean indicating if connections have been generated
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

#### `questions`
Stores questions belonging to forms:
- `id` - UUID primary key
- `form_id` - UUID reference to forms(id)
- `text` - Question text
- `order` - Integer order of question in form
- `time_limit` - Optional time limit in seconds
- `created_at` - Timestamp of creation

#### `responses`
Stores responses to forms:
- `id` - UUID primary key
- `form_id` - UUID reference to forms(id)
- `user_id` - Optional UUID reference to auth.users(id)
- `respondent_name` - Name of respondent
- `respondent_email` - Email of respondent
- `summary` - AI-generated summary of response
- `embedding_id` - Reference to the embedding stored in Qdrant
- `created_at` - Timestamp of creation

#### `answers`
Stores individual answers to questions:
- `id` - UUID primary key
- `response_id` - UUID reference to responses(id)
- `question_id` - UUID reference to questions(id)
- `text` - Answer text
- `time_spent` - Time spent answering in seconds
- `created_at` - Timestamp of creation

#### `connections`
Stores connections between responses:
- `id` - UUID primary key
- `form_id` - UUID reference to forms(id)
- `response1_id` - UUID reference to responses(id)
- `response2_id` - UUID reference to responses(id)
- `similarity_score` - Float score of similarity
- `created_at` - Timestamp of creation

### Indexes
The database includes the following performance indexes:
- `forms_user_id_idx` on `forms(user_id)`
- `questions_form_id_idx` on `questions(form_id)`
- `responses_form_id_idx` on `responses(form_id)`
- `answers_response_id_idx` on `answers(response_id)`
- `answers_question_id_idx` on `answers(question_id)`
- `connections_form_id_idx` on `connections(form_id)`

### Row Level Security (RLS)
All tables have Row Level Security (RLS) enabled with specific policies:

#### Profiles
- Users can read and update their own profiles

#### Forms
- Form owners can perform all operations on their forms
- Published forms are readable by everyone

#### Questions
- Questions are readable by everyone
- Only form owners can modify questions

#### Responses
- Form owners can read all responses to their forms
- Users can create responses to published forms accepting responses
- Users can view their own responses

#### Answers
- Form owners can read all answers to their forms
- Users can insert answers to their own responses

#### Connections
- Form owners can read connections for their forms

### Database Functions
The database includes the following functions:

#### `exec_sql`
```sql
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
```

#### `update_updated_at_column`
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

## Core Services

### Supabase Service
Located in `/src/lib/supabase.ts`, this service handles:
- Database interactions
- Authentication
- User profile management
- Form management
- Response processing
- Connection generation

#### Key Functions

**Authentication:**
- `getCurrentUser()`: Gets the current authenticated user
- `getCurrentUserProfile()`: Gets the current user's profile
- `upsertUserProfile(profile)`: Creates or updates a user profile

**Form Management:**
- `createForm(userId, title, description)`: Creates a new form
- `addQuestionsToForm(formId, questions)`: Adds questions to a form
- `publishForm(formId)`: Updates a form's publish status
- `stopAcceptingResponses(formId)`: Updates a form's response acceptance status
- `getFormById(formId)`: Gets a form by ID
- `getUserForms(userId)`: Gets all forms created by a user
- `updateForm(formId, updates)`: Updates a form's details
- `updateQuestion(questionId, updates)`: Updates a question's details
- `deleteQuestion(questionId)`: Deletes a question
- `deleteForm(formId)`: Deletes a form and all related data

**Response Management:**
- `createResponse(formId, userId, name, email)`: Creates a new response
- `submitAnswers(responseId, answers)`: Submits answers for a response
- `getFormResponses(formId)`: Gets responses for a form

**Connection Management:**
- `processFormResponses(formId)`: Processes form responses to generate summaries and embeddings
- `generateAndStoreConnections(formId)`: Generates and stores connections between form responses
- `getFormConnections(formId)`: Gets all connections for a form

**Implementation Notes:**
- Uses a shared `enhancedFetch` implementation with improved error handling
- Implements client-side and server-side Supabase clients
- Safely handles environment variable checks
- Uses TypeScript interfaces for database types

### OpenAI Service
Located in `/src/lib/openai.ts`, this service handles:
- Embedding generation
- Text summarization

#### Key Functions

- `createEmbedding(text)`: Creates an embedding for text using OpenAI's text-embedding-3-large model
- `generatePersonSummary(formTitle, formDescription, questions, answers, personName)`: Generates a summary of a person based on their form responses using GPT-4o-mini

**Implementation Notes:**
- Uses server-side initialization for security
- Implements proper error handling
- Enforces server-side execution

### Qdrant Service
Located in `/src/lib/qdrant.ts`, this service handles:
- Vector storage and retrieval
- Similarity search

#### Key Functions

- `cosineSimilarity(a, b)`: Calculates cosine similarity between two vectors
- `findSimilarResponses(formId, responseId, vector, limit)`: Finds similar responses based on vector similarity
- `getSimilarity(pointId1, pointId2)`: Gets similarity between two points in Qdrant
- `ensureCollectionExists()`: Creates collection for storing form response embeddings if it doesn't exist
- `storeResponseEmbedding(responseData, summary)`: Stores a response embedding in Qdrant
- `generateFormConnections(formId)`: Generates connections between all responses in a form

**Implementation Notes:**
- Wraps Qdrant client methods to ensure server-side execution
- Implements Qdrant vector operations
- Provides TypeScript types for all parameters

### Client API Service
Located in `/src/lib/client.ts`, this service provides client-side wrappers for server-side API calls:

#### Key Functions
- `generateEmbedding(text)`: Generates an embedding for text via server API
- `searchVectors(params)`: Searches for similar vectors in Qdrant collection
- `retrieveVector(params)`: Retrieves a vector from Qdrant by point ID
- `generateCompletion(params)`: Generates an OpenAI completion via server-side API

**Implementation Notes:**
- Implements proper error handling
- Provides type-safe interfaces for API calls

### Environment Utilities
Located in `/src/lib/env.ts`, this provides utilities for determining execution context:

- `isServer`: Determines if code is running on the server
- `isClient`: Determines if code is running on the client
- `ensureServer(functionName)`: Ensures a function is only called on the server
- `ensureClient(functionName)`: Ensures a function is only called on the client

## API Endpoints

### Forms Submission API
**Endpoint**: `POST /api/forms/submit`

**Description**: Handles form submissions from respondents

**Request Body**:
```json
{
  "formId": "string",
  "name": "string",
  "email": "string",
  "answers": [
    {
      "question_id": "string",
      "text": "string",
      "time_spent": "number"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "responseId": "string",
  "answerCount": "number"
}
```

**Error Responses**:
- 400: Missing required fields
- 403: Form not accepting responses
- 404: Form not found
- 500: Server error

**Implementation Notes**:
- Handles both service role and anonymous key authentication
- Implements fallback mechanisms for different authentication methods
- Performs validation checks on the form (published, accepting responses)
- Creates response and submits answers in transaction

### Embeddings API
**Endpoint**: `POST /api/embeddings`

**Description**: Generates text embeddings using OpenAI

**Request Body**:
```json
{
  "text": "string"
}
```

**Response**:
```json
{
  "embedding": "number[]"
}
```

**Error Responses**:
- 400: Missing text parameter
- 500: Embedding generation error

### Vector Operations API
**Endpoint**: `POST /api/vectors`

**Description**: Handles vector operations with Qdrant

**Request Body**:
```json
{
  "operation": "search|retrieve",
  "collectionName": "string",
  "vector": "number[]",
  "limit": "number",
  "filter": "object",
  "pointId": "string"
}
```

**Response**:
```json
{
  "results": "object[]"
}
```

**Error Responses**:
- 400: Missing required parameters or invalid operation
- 500: Vector operation error

### OpenAI Completions API
**Endpoint**: `POST /api/completions`

**Description**: Generates text completions using OpenAI

**Request Body**:
```json
{
  "messages": [
    {
      "role": "string",
      "content": "string"
    }
  ],
  "model": "string",
  "temperature": "number"
}
```

**Response**:
```json
{
  "message": "object",
  "usage": "object"
}
```

**Error Responses**:
- 400: Missing or invalid messages parameter
- 500: Completion generation error

## Authentication & Authorization

ConnectU uses Supabase Auth for authentication and Row Level Security (RLS) for authorization.

### Authentication
- Authentication is handled by Supabase Auth
- JWT tokens are used for session management
- Token storage and refresh are handled by the Supabase client

### User Management
- User profiles are stored in the `profiles` table
- Profile creation is automatically handled when a user signs up
- Profile updates are managed through the `upsertUserProfile` function

### Authorization
Authorization is implemented through Row Level Security (RLS) policies:

- **User authentication** is required for creating forms
- **Form ownership** is enforced for form management operations
- **Form publishing** is required for collecting responses
- **Form response acceptance** is enforced for submitting responses

## Vector Database Integration

ConnectU uses Qdrant as a vector database to store and query embeddings of form responses.

### Collection Structure
- Collection name: `responses`
- Vector size: 1536 (for text-embedding-3-large model)
- Distance metric: Cosine similarity

### Vector Point Structure
- ID: `${formId}_${responseId}`
- Vector: embedding of response summary
- Payload:
  - `form_id`: Form ID
  - `response_id`: Response ID
  - `respondent_name`: Respondent name
  - `respondent_email`: Respondent email
  - `summary`: Generated summary

### Similarity Search
- Responses are compared using cosine similarity
- Connections are generated based on similarity scores
- Connections are sorted by similarity score (highest first)

## AI Integration

ConnectU uses OpenAI's models for:

### Text Embeddings
- Model: text-embedding-3-large
- Used for vectorizing response summaries
- 1536-dimensional vectors

### Summary Generation
- Model: gpt-4o-mini
- Prompt: Custom prompt to generate concise, objective summaries
- Length: 150-200 words per summary
- Temperature: 0.7 (balanced creativity)

## Deployment

### Database Setup
The database schema can be applied using:
```
npm run apply-schema
```

This script:
1. Connects to the Supabase database using environment variables
2. Reads the schema from `/db/schema.sql`
3. Splits the schema into individual statements
4. Executes each statement using the `exec_sql` function

### RLS Policies Setup
RLS policies can be updated using:
```
npm run update-rls
```

### Environment Configuration
Environment variables must be set for:
- Supabase: URL, anon key, service role key
- OpenAI: API key
- Qdrant: URL, API key

## Development Workflow

### Setup Scripts
- `npm run dev`: Starts the development server with turbopack
- `npm run build`: Builds the application for production
- `npm run start`: Starts the production server
- `npm run lint`: Lints the codebase
- `npm run apply-schema`: Applies the database schema
- `npm run update-rls`: Updates RLS policies

### Core Files
- `/src/lib/supabase.ts`: Supabase service
- `/src/lib/openai.ts`: OpenAI service
- `/src/lib/qdrant.ts`: Qdrant service
- `/src/lib/client.ts`: Client API service
- `/src/lib/env.ts`: Environment utilities
- `/src/app/api/`: API routes
- `/db/schema.sql`: Database schema
- `/db/functions.sql`: Database functions

### Component Architecture
- `/src/components/FormBuilder.tsx`: Form creation component
- `/src/components/FormRenderer.tsx`: Form response collection component
- `/src/components/QuestionForm.tsx`: Question editing component
- `/src/components/Timer.tsx`: Time limit functionality

### Type Definitions
- `Form`: Form definition with metadata
- `Question`: Question in a form with text, order, and time limit
- `Response`: Form response with metadata and summary
- `Answer`: Individual answer to a question
- `Connection`: Connection between two responses
- `Profile`: User profile extending Supabase Auth

### Error Handling
- All API endpoints include proper error handling
- Database operations are wrapped in try/catch blocks
- Client-side API calls include error handling with user-friendly messages
- Server-side errors are logged with detailed information

### Security Considerations
- API keys are never exposed to the client
- OpenAI and Qdrant services are only accessible server-side
- RLS policies control access to data
- Service role key is only used server-side
- Proper input validation is performed on all API endpoints
- Content-Security-Policy headers should be configured in production

## Conclusion

This documentation provides a comprehensive overview of the ConnectU backend architecture and implementation. By understanding these components, backend engineers can effectively maintain, extend, and optimize the system.

For additional questions or clarifications, please refer to the codebase or contact the development team.