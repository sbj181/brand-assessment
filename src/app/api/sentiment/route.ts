import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { term, context } = await request.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a brand strategy expert for a creative solutions agency. Analyze brand sentiment and return JSON focusing on actionable insights aligned with our services. Include:
            {
              "overallSentiment": 0-100,
              "brandPerception": "brief perception summary focusing on brand alignment and market positioning",
              "marketPosition": "brief position analysis highlighting strategic opportunities",
              "socialMetrics": {
                "twitter": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "linkedin": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "facebook": { "total": number, "daily": [7 numbers], "trend": "up|down|stable" },
                "totalMentions": number
              },
              "socialInsight": "analysis focusing on communication strategy and digital presence improvements",
              "brandReach": "summary emphasizing digital footprint and communication channel effectiveness",
              "keyStrengths": [
                "3-5 strengths that align with current market demands",
                "Focus on brand positioning, digital presence, and communication effectiveness"
              ],
              "potentialConcerns": [
                "2-3 concerns that The Grovery can directly address",
                "Emphasize gaps in strategy, digital presence, or brand alignment"
              ],
              "opportunities": [
                "2-3 specific opportunities that align with The Grovery's services",
                "Focus on strategic improvements, digital solutions, and communication enhancements"
              ],
              "competitors": [
                {
                  "name": "competitor name",
                  "type": "direct|indirect|potential",
                  "sentiment": "higher|lower|similar",
                  "marketShare": "percentage or unknown",
                  "strengths": [
                    "1-2 key strengths focused on areas where strategic improvements could help compete"
                  ],
                  "description": "competitive position analysis highlighting actionable differentiation opportunities"
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
