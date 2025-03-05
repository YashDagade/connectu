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
 * @returns A vector representation (embedding) of the text
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536, // Using 1536 dimensions for better representation
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

/**
 * Generates a detailed 600-word summary of a person based on their form responses
 * @param formTitle The title of the form they filled out
 * @param formDescription The description of the form providing context
 * @param questions Array of question objects with id and text
 * @param answers Object mapping question ids to the person's answers
 * @param personName Name of the person (optional)
 * @returns A detailed verbose summary highlighting the person's unique characteristics
 */
export async function generatePersonSummary(
  formTitle: string,
  formDescription: string,
  questions: Array<{ id: string, text: string }>,
  answers: Record<string, string>,
  personName?: string
): Promise<string> {
  try {
    // Format the questions and answers for the prompt
    const questionAnswerPairs = questions.map(question => {
      return `Question: ${question.text}\nAnswer: ${answers[question.id] || "No answer provided"}`;
    }).join("\n\n");

    // Craft a detailed prompt for GPT-4o
    const prompt = `
You are an expert profiler tasked with creating comprehensive, engaging personality profiles.

# CONTEXT
You're analyzing responses for a form titled "${formTitle}". 
The form's purpose was described as: "${formDescription}"

# PERSON INFORMATION
${personName ? `Name: ${personName}` : ""}

# RESPONSES
${questionAnswerPairs}

# TASK
Create a detailed 600-word summary that captures this person's unique characteristics, experiences, and perspectives.

Your summary should:
1. Be written in third person, present tense
2. Highlight what makes this person distinct and memorable
3. Connect their responses to the purpose of the form (${formTitle})
4. Extrapolate reasonable insights without making unfounded assumptions
5. Create a coherent narrative that weaves together different aspects of their responses
6. Be specific rather than generic - reference actual details from their answers
7. Balance positive attributes with neutral observations
8. Use varied sentence structure and sophisticated vocabulary
9. Maintain a warm, professional tone
10. Include a brief conclusion that summarizes their core attributes relevant to the form's purpose

# IMPORTANT GUIDELINES
- DO NOT simply list or paraphrase their answers - synthesize and interpret
- DO NOT use generic filler phrases or platitudes
- DO NOT exceed 600 words or fall significantly short
- DO NOT make assumptions about demographics unless clearly stated in their responses
- DO create a rich, multidimensional portrait that feels authentic and human

Write only the summary, formatted as a cohesive profile. Begin immediately with substance - do not include headings or introductory statements about what you're going to write.
`;

    // Call GPT-4o to generate the summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a skilled writer who creates detailed, insightful personality profiles based on form responses." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // Balanced between creativity and consistency
      max_tokens: 1000, // Enough for approximately 600 words
      top_p: 0.9,
      frequency_penalty: 0.3, // Slight penalty to reduce repetition
      presence_penalty: 0.3, // Slight penalty to encourage topic diversity
    });

    return completion.choices[0].message.content || "Unable to generate summary";
  } catch (error) {
    console.error('Error generating person summary:', error);
    throw error;
  }
}

export { openai }; 