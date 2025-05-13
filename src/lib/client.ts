/**
 * Client-side API utilities 
 */

/**
 * Generate an embedding for the given text by calling the server API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate embedding');
    }
    
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search for similar vectors in Qdrant collection
 */
export async function searchVectors(params: {
  collectionName: string;
  vector: number[];
  limit: number;
  filter?: Record<string, unknown>;
}) {
  try {
    const response = await fetch('/api/vectors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'search',
        ...params
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search vectors');
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching vectors:', error);
    throw error;
  }
}

/**
 * Retrieve a vector from Qdrant by point ID
 */
export async function retrieveVector(params: {
  collectionName: string;
  pointId: string;
}) {
  try {
    const response = await fetch('/api/vectors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'retrieve',
        ...params
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve vector');
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error retrieving vector:', error);
    throw error;
  }
}

/**
 * Generate an OpenAI completion via server-side API
 */
export async function generateCompletion(params: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
}) {
  try {
    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate completion');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating completion:', error);
    throw error;
  }
} 