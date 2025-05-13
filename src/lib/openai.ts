import OpenAI from "openai";
import { ensureServer } from "./env";

// Initialize OpenAI only on the server side
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  ensureServer("getOpenAIClient");
  
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

/**
 * Create an embedding for the given text
 * This function must only be called from server-side code
 */
export async function createEmbedding(text: string): Promise<number[]> {
  ensureServer("createEmbedding");
  
  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: "text-embedding-3-large", 
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw new Error("Error creating embedding");
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
  ensureServer("generatePersonSummary");
  
  try {
    const questionAnswerPairs = questions.map(q => ({
      question: q.text,
      answer: answers[q.id] || 'No answer provided'
    }));
    
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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