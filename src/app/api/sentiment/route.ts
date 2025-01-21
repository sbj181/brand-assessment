import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { term, context } = await request.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Analyze brand sentiment and return JSON. Include:
            {
              "overallSentiment": 0-100,
              "brandPerception": "brief perception summary",
              "marketPosition": "brief position summary",
              "socialMetrics": {
                "twitter": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "linkedin": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "facebook": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "totalMentions": number
              },
              "socialInsight": "brief social media analysis",
              "brandReach": "brief reach summary",
              "keyStrengths": ["3-5 strengths"],
              "potentialConcerns": ["2-3 concerns"],
              "competitors": [
                {
                  "name": "competitor name",
                  "type": "direct|indirect|potential",
                  "sentiment": "higher|lower|similar",
                  "marketShare": "percentage or unknown",
                  "strengths": ["1-2 key strengths"],
                  "description": "brief competitive position"
                }
              ]
            }`
        },
        {
          role: "user",
          content: `Brand: ${term}\nContext: ${JSON.stringify(context)}`
        }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    try {
      const sentimentData = JSON.parse(responseText);
      
      // Validate the response has required fields
      if (!sentimentData.overallSentiment || !sentimentData.socialMetrics) {
        throw new Error('Invalid response structure');
      }

      // Calculate total mentions if not provided
      if (!sentimentData.socialMetrics.totalMentions) {
        sentimentData.socialMetrics.totalMentions = 
          sentimentData.socialMetrics.twitter.total +
          sentimentData.socialMetrics.linkedin.total +
          sentimentData.socialMetrics.facebook.total;
      }

      return NextResponse.json({ 
        sentiment: sentimentData,
        success: true 
      });

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse sentiment analysis response');
    }

  } catch (error) {
    console.error('Error in sentiment API:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze sentiment',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }, { status: 500 });
  }
}
