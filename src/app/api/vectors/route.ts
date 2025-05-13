import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient } from '@/lib/qdrant';

export async function POST(request: NextRequest) {
  try {
    // Verify that the user is authenticated
    // Implement proper authentication here
    
    const { operation, ...data } = await request.json();
    
    if (!operation) {
      return NextResponse.json(
        { error: 'Missing required operation parameter' },
        { status: 400 }
      );
    }
    
    // Handle different vector operations
    switch (operation) {
      case 'search':
        // Validate required parameters
        if (!data.collectionName || !data.vector || !data.limit) {
          return NextResponse.json(
            { error: 'Missing required parameters for search operation' },
            { status: 400 }
          );
        }
        
        const searchResults = await qdrantClient.search(
          data.collectionName,
          {
            vector: data.vector,
            limit: data.limit,
            filter: data.filter,
          }
        );
        
        return NextResponse.json({ results: searchResults });
        
      case 'retrieve':
        // Validate required parameters
        if (!data.collectionName || !data.pointId) {
          return NextResponse.json(
            { error: 'Missing required parameters for retrieve operation' },
            { status: 400 }
          );
        }
        
        const retrieveResults = await qdrantClient.retrieve(
          data.collectionName,
          [data.pointId],
          { with_vector: true }
        );
        
        return NextResponse.json({ results: retrieveResults });
        
      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Vector operation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Failed to perform vector operation: ${error.message}` 
          : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 