import OpenAI from 'openai';

// Initialize OpenAI client with proper API key handling for both client and server
const apiKey = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_OPENAI_API_KEY 
  : process.env.OPENAI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.warn('OpenAI API key not found. Some features may not work correctly.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key-for-client-initialization',
  dangerouslyAllowBrowser: true // Allow browser usage
});

/**
 * Creates an embedding for the given text using OpenAI's text-embedding-3-large model
 * @param text The text to create an embedding for
 * @returns A vector of floating point numbers representing the embedding
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to create embedding:', error);
    throw error;
  }
}

/**
 * Generates a summary of a person based on their form responses
 */
export async function generatePersonSummary(
  formTitle: string,
  formDescription: string,
  questions: Array<{ id: string, text: string }>,
  answers: Record<string, string>,
  personName?: string
): Promise<string> {
  try {
    const questionAnswerPairs = questions.map(q => ({
      question: q.text,
      answer: answers[q.id] || 'No answer provided'
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 
            "You are an assistant that creates concise, objective summaries of people based on their answers to questionnaires. " +
            "Focus on extracting key interests, values, experiences, and personality traits. " +
            "Be factual, avoiding subjective judgments. Your summary should be 150-200 words."
        },
        {
          role: "user",
          content: `
            Please create a summary of ${personName || 'a person'} based on their responses to the "${formTitle}" form.
            
            Form description: ${formDescription}
            
            Responses:
            ${questionAnswerPairs.map(qa => `Question: ${qa.question}\nAnswer: ${qa.answer}`).join('\n\n')}
            
            Create a concise 150-200 word summary that captures this person's key qualities, interests, and perspectives.
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return response.choices[0].message.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating person summary:', error);
    return `A summary could not be generated due to an error.`;
  }
}

export { openai }; 