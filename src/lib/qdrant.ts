import { QdrantClient } from '@qdrant/js-client-rest';
import { createEmbedding } from './openai';

// Initialize the Qdrant client with proper API key handling for both client and server
const qdrantUrl = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_QDRANT_URL
  : process.env.QDRANT_URL;

const qdrantApiKey = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_QDRANT_API_KEY
  : process.env.QDRANT_API_KEY;

// Check if Qdrant configuration is available
if (!qdrantUrl || !qdrantApiKey) {
  console.warn('Qdrant configuration not found. Some features may not work correctly.');
}

// Initialize the Qdrant client
export const qdrantClient = new QdrantClient({
  url: qdrantUrl || '',
  apiKey: qdrantApiKey,
});

// Collection name for form responses
const RESPONSES_COLLECTION = 'form_responses';

// Create a collection for storing form response embeddings if it doesn't exist
export async function ensureCollectionExists() {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === RESPONSES_COLLECTION
    );

    if (!collectionExists) {
      // Create collection with the proper configuration
      await qdrantClient.createCollection(RESPONSES_COLLECTION, {
        vectors: {
          size: 1536, // Size for text-embedding-3-large model
          distance: 'Cosine',
        },
      });
      
      console.log(`Created collection "${RESPONSES_COLLECTION}"`);
    }
  } catch (error) {
    console.error('Error ensuring collection exists:', error);
    throw error;
  }
}

// Interface for response data
interface ResponseData {
  formId: string;
  responseId: string;
  respondentName: string;
  respondentEmail: string;
  summary: string;
}

/**
 * Stores a response embedding in Qdrant
 * @param responseData The response data
 * @param summary The generated summary text to create embedding from
 * @returns The ID of the stored vector in Qdrant
 */
export async function storeResponseEmbedding(
  responseData: ResponseData,
  summary: string
): Promise<string> {
  try {
    // Ensure the collection exists
    await ensureCollectionExists();
    
    // Create embedding for the summary
    const embedding = await createEmbedding(summary);
    
    // Generate a unique ID for the vector
    const pointId = `${responseData.formId}_${responseData.responseId}`;
    
    // Store the vector in Qdrant
    await qdrantClient.upsert(RESPONSES_COLLECTION, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            form_id: responseData.formId,
            response_id: responseData.responseId,
            respondent_name: responseData.respondentName,
            respondent_email: responseData.respondentEmail,
            summary: summary,
          },
        },
      ],
    });
    
    return pointId;
  } catch (error) {
    console.error('Error storing response embedding:', error);
    throw error;
  }
}

/**
 * Finds the most similar responses to a given response
 * @param formId The ID of the form
 * @param responseId The ID of the response to find matches for
 * @param limit The maximum number of matches to return
 * @returns Array of matches with similarity scores
 */
export async function findSimilarResponses(
  formId: string,
  responseId: string,
  limit: number = 10
) {
  try {
    const pointId = `${formId}_${responseId}`;
    
    // Search for similar responses within the same form
    const searchResult = await qdrantClient.search(RESPONSES_COLLECTION, {
      vector: null, // We'll use the stored vector as the query
      with_vector: false, // No need to return the vector
      with_payload: true, // Include payload in results
      limit: limit + 1, // +1 because the query itself will be included
      filter: {
        must: [
          {
            key: 'form_id',
            match: {
              value: formId,
            },
          },
        ],
      },
      using: 'id', // Search using the ID of the point
      search_params: {
        exact: false,
        ef: 128, // Increase for better recall
      },
      id: pointId, // ID of the point to use as the query
    });
    
    // Filter out the query point itself and convert to a more usable format
    return searchResult.filter(
      (match) => match.payload?.response_id !== responseId
    ).map((match) => ({
      responseId: match.payload?.response_id,
      respondentName: match.payload?.respondent_name,
      respondentEmail: match.payload?.respondent_email,
      similarityScore: match.score,
    }));
  } catch (error) {
    console.error('Error finding similar responses:', error);
    throw error;
  }
}

/**
 * Generates connections between all responses in a form
 * @param formId The ID of the form
 * @returns Array of connections between responses
 */
export async function generateFormConnections(formId: string) {
  try {
    // Get all responses for this form from Qdrant
    const searchResult = await qdrantClient.scroll(RESPONSES_COLLECTION, {
      filter: {
        must: [
          {
            key: 'form_id',
            match: {
              value: formId,
            },
          },
        ],
      },
      with_payload: true,
      with_vector: false,
      limit: 100, // Adjust based on your expected maximum number of responses
    });
    
    const responses = searchResult.points;
    const connections = [];
    
    // Generate all unique pairs (combinatorial)
    for (let i = 0; i < responses.length; i++) {
      const response1 = responses[i];
      
      for (let j = i + 1; j < responses.length; j++) {
        const response2 = responses[j];
        
        // Find similarity between the two responses
        const similarity = await findSimilarityBetweenPoints(
          response1.id.toString(),
          response2.id.toString()
        );
        
        connections.push({
          response1Id: response1.payload?.response_id,
          response2Id: response2.payload?.response_id,
          response1Name: response1.payload?.respondent_name,
          response2Name: response2.payload?.respondent_name,
          similarityScore: similarity,
        });
      }
    }
    
    // Sort connections by similarity score (highest first)
    return connections.sort((a, b) => b.similarityScore - a.similarityScore);
  } catch (error) {
    console.error('Error generating form connections:', error);
    throw error;
  }
}

/**
 * Finds the similarity score between two points in Qdrant
 * @param pointId1 The ID of the first point
 * @param pointId2 The ID of the second point
 * @returns The similarity score between the two points
 */
async function findSimilarityBetweenPoints(pointId1: string, pointId2: string): Promise<number> {
  try {
    // Get the vectors for both points
    const [point1, point2] = await Promise.all([
      qdrantClient.getPoints(RESPONSES_COLLECTION, {
        ids: [pointId1],
        with_vector: true,
      }),
      qdrantClient.getPoints(RESPONSES_COLLECTION, {
        ids: [pointId2],
        with_vector: true,
      }),
    ]);
    
    if (!point1.points[0]?.vector || !point2.points[0]?.vector) {
      throw new Error('Could not retrieve vectors for points');
    }
    
    // Calculate cosine similarity
    const vector1 = point1.points[0].vector as number[];
    const vector2 = point2.points[0].vector as number[];
    
    return calculateCosineSimilarity(vector1, vector2);
  } catch (error) {
    console.error('Error calculating similarity between points:', error);
    throw error;
  }
}

/**
 * Calculates the cosine similarity between two vectors
 * @param vec1 First vector
 * @param vec2 Second vector
 * @returns Cosine similarity score (between -1 and 1, higher is more similar)
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
} 