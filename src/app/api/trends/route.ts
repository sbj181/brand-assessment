import { NextResponse } from 'next/server';
import { interestOverTime } from 'google-trends-api';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // Determine if input is URL or search term
    let searchTerm;
    try {
      const urlObj = new URL(url);
      searchTerm = urlObj.hostname.replace('www.', '');
    } catch {
      // If not a valid URL, use the input directly as search term
      searchTerm = url;
    }
    
    console.log('Searching trends for:', searchTerm);

    const result = await interestOverTime({
      keyword: searchTerm,
      startTime: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)),
      endTime: new Date(),
    });

    const parsedData = JSON.parse(result);
    
    // Check if we got meaningful data
    const hasData = parsedData.default?.timelineData?.some(
      (item: any) => item.hasData[0]
    );

    if (!hasData) {
      return NextResponse.json(
        { error: 'No trend data available for this search term' },
        { status: 404 }
      );
    }

    return NextResponse.json(parsedData);
    
  } catch (error) {
    console.error('Detailed API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
