import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with the server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verify that the user is authenticated
    // Implement proper authentication here
    
    const requestData = await request.json();
    const { messages, model = "gpt-4o-mini", temperature = 0.7 } = requestData;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid messages parameter' },
        { status: 400 }
      );
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      store: true,
    });
    
    return NextResponse.json({
      message: completion.choices[0].message,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('OpenAI completion error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Failed to generate completion: ${error.message}` 
          : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 