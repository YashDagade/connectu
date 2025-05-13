import { QdrantClient } from "@qdrant/js-client-rest";
import { createEmbedding } from './openai';
import { ensureServer } from "./env";

export const RESPONSES_COLLECTION = "responses";

// Initialize Qdrant client only on the server side
let _qdrantClient: QdrantClient | null = null;

function getQdrantClient(): QdrantClient {
  ensureServer("getQdrantClient");
  
  if (!_qdrantClient) {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
      throw new Error("QDRANT_URL or QDRANT_API_KEY environment variables are not set");
    }
    
    _qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  
  return _qdrantClient;
}

// Define types for Qdrant search params
type SearchParams = {
  vector: number[];
  limit: number;
  filter?: Record<string, unknown>;
  [key: string]: unknown;
};

// Define types for Qdrant retrieve params
type RetrieveParams = {
  with_vector?: boolean;
  [key: string]: unknown;
};

// Define types for Qdrant upsert params
type UpsertParams = {
  wait?: boolean;
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>;
};

// Define types for Qdrant scroll params
type ScrollParams = {
  filter?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  with_vectors?: boolean;
  with_payload?: boolean;
  [key: string]: unknown;
};

// Re-export for convenience, but ensure it's only used server-side
export const qdrantClient = {
  // Wrap all methods to ensure they're only called on the server
  search: async (collectionName: string, searchParams: SearchParams) => {
    ensureServer("qdrantClient.search");
    return getQdrantClient().search(collectionName, searchParams);
  },
  
  retrieve: async (collectionName: string, ids: string[], params?: RetrieveParams) => {
    ensureServer("qdrantClient.retrieve");
    // Convert array of IDs to an object with ids property as required by the Qdrant API
    return getQdrantClient().retrieve(collectionName, { ids, ...params });
  },
  
  getCollections: async () => {
    ensureServer("qdrantClient.getCollections");
    return getQdrantClient().getCollections();
  },
  
  createCollection: async (collectionName: string, config: Record<string, unknown>) => {
    ensureServer("qdrantClient.createCollection");
    return getQdrantClient().createCollection(collectionName, config);
  },
  
  upsert: async (collectionName: string, config: UpsertParams) => {
    ensureServer("qdrantClient.upsert");
    return getQdrantClient().upsert(collectionName, config);
  },
  
  scroll: async (collectionName: string, params: ScrollParams) => {
    ensureServer("qdrantClient.scroll");
    return getQdrantClient().scroll(collectionName, params);
  },
  
  // Add other methods you need to use
};

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  // Don't need to check for server/client as this is a pure math function
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findSimilarResponses(
  formId: string,
  responseId: string,
  vector: number[],
  limit: number = 5
) {
  ensureServer("findSimilarResponses");
  
  try {
    const searchResults = await qdrantClient.search(RESPONSES_COLLECTION, {
      vector: vector,
      limit: limit,
      filter: {
        must: [
          {
            key: "formId",
            match: {
              value: formId,
            },
          },
          {
            key: "responseId",
            match: {
              value: responseId,
            },
          },
        ],
      },
    });
    
    return searchResults;
  } catch (error) {
    console.error("Error finding similar responses:", error);
    throw error;
  }
}

export async function getSimilarity(pointId1: string, pointId2: string): Promise<number> {
  ensureServer("getSimilarity");
  
  try {
    // Get vectors for both points
    const [point1, point2] = await Promise.all([
      qdrantClient.retrieve(RESPONSES_COLLECTION, [pointId1], { with_vector: true }),
      qdrantClient.retrieve(RESPONSES_COLLECTION, [pointId2], { with_vector: true }),
    ]);
    
    // Check if we got back vectors for both points
    if (!point1[0]?.vector || !point2[0]?.vector) {
      throw new Error("Failed to retrieve vectors for both points");
    }
    
    // Ensure vectors are numeric arrays
    const vector1 = point1[0].vector as number[];
    const vector2 = point2[0].vector as number[];
    
    // Calculate cosine similarity between the two vectors
    return cosineSimilarity(vector1, vector2);
  } catch (error) {
    console.error("Error calculating similarity:", error);
    throw error;
  }
}

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
        const similarity = await getSimilarity(response1.id.toString(), response2.id.toString());
        
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