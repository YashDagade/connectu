import { NextRequest, NextResponse } from 'next/server';
import { createEmbedding } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Verify that the user is authenticated
    // This implementation would depend on your authentication method
    // You should implement proper authentication checks here
    
    const requestData = await request.json();
    const { text } = requestData;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required text parameter' },
        { status: 400 }
      );
    }
    
    // Generate the embedding securely on the server
    const embedding = await createEmbedding(text);
    
    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Failed to generate embedding: ${error.message}` 
          : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 