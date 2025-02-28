# ConnectU

ConnectU is a platform designed to connect people through meaningful questions. Users can create forms with thoughtful questions that help reveal values and perspectives. After gathering responses, ConnectU matches people with similar perspectives using AI-powered embedding similarity.

## Features

- **Create Connection Forms**: Design custom forms with thoughtful questions
- **Share Forms**: Easily distribute forms to collect responses
- **Generate Connections**: AI-powered matching connects people with similar perspectives
- **Customize Matching**: Select group sizes and matching preferences

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Vector Database**: Qdrant for storing and querying embeddings
- **AI**: OpenAI API for generating text embeddings

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- Qdrant instance (cloud or self-hosted)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/connectu.git
   cd connectu
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the environment variables file:
   ```
   cp .env.example .env.local
   ```

4. Update `.env.local` with your API keys and configuration.

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: Next.js app router with pages
- `src/components`: Reusable React components
- `src/lib`: Utility libraries for Supabase, OpenAI, etc.
- `src/utils`: Helper functions

## Understanding the Connection Algorithm

ConnectU uses text embeddings to connect people:

1. When a form is submitted, responses are converted to embeddings using OpenAI's API
2. These embeddings are stored in Qdrant, a vector database
3. When generating connections, we query the embeddings to find similarity between respondents
4. Groups are formed based on similarity scores and user-defined preferences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need for more meaningful connections in digital spaces
- Built with Next.js, Supabase, and OpenAI technologies
