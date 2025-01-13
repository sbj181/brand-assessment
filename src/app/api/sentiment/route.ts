import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { term, context } = await request.json();
    console.log('Sentiment Analysis Request:', { term, contextKeys: Object.keys(context) });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a brand sentiment analyzer. Analyze the provided brand information and return a JSON structure with these exact fields:
            - overallSentiment: number between 0-100
            - brandPerception: string describing how the brand is perceived
            - marketPosition: string describing market standing
            - publicSentiment: string about public opinion
            - keyStrengths: array of strings listing main strengths
            - potentialConcerns: array of strings listing concerns
            
            Format your response as valid JSON without any additional text.`
        },
        {
          role: "user",
          content: `Analyze the brand sentiment for: ${term}. Here is the context: ${JSON.stringify(context)}`
        }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    console.log('Raw OpenAI Response:', responseText);
    
    try {
      const sentimentData = JSON.parse(responseText);
      console.log('Parsed Sentiment Data:', sentimentData);
      return NextResponse.json({ sentiment: sentimentData });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse sentiment analysis response');
    }

  } catch (error) {
    console.error('Error in sentiment API:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze sentiment.',
      details: error.message 
    }, { status: 500 });
  }
}
