# ConnectU

A web application for creating forms, collecting responses, and connecting people based on similarities in their responses.

## Features

- Create custom forms with multiple questions
- Share forms with anyone via link
- Collect responses from users
- Process responses to generate detailed summaries using AI
- Store vector embeddings of summaries for similarity matching
- Generate connections between respondents based on similarity
- View and manage connections

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Vector Database**: Qdrant
- **AI**: OpenAI for embeddings and summary generation

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account
- Qdrant account (or self-hosted instance)
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Qdrant Configuration
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ConnectU.git
   cd ConnectU
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up the database schema
   ```
   node scripts/apply-schema.js
   ```

4. Run the development server
   ```
   npm run dev
   ```

## Database Structure

The application uses the following database tables:

- **profiles**: User profiles extending Supabase Auth
- **forms**: Form definitions created by users
- **questions**: Questions within forms
- **responses**: Form responses from participants
- **answers**: Individual answers to questions
- **connections**: Connections between form respondents

## Workflow

1. **Create a Form**: Users create forms with custom questions
2. **Share the Form**: Forms can be shared with anyone via link
3. **Collect Responses**: Respondents fill out the form
4. **Stop Accepting Responses**: Form owner stops accepting responses
5. **Process Responses**: AI generates summaries and embeddings
6. **Generate Connections**: System finds connections between respondents
7. **View Connections**: Form owner can view and manage connections

## API Structure

### Supabase Functions

- User authentication and profile management
- Form CRUD operations
- Response collection and storage
- Connection management

### Qdrant Functions

- Store and manage vector embeddings
- Find similar responses
- Calculate similarity scores

### OpenAI Functions

- Generate embeddings for responses
- Create detailed summaries of responses

## License

[MIT](LICENSE)
