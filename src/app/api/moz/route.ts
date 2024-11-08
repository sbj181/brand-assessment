import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const response = await fetch('https://lsapi.seomoz.com/v2/url_metrics', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.MOZ_ACCESS_ID + ':' + process.env.MOZ_SECRET_KEY).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targets: [url] }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 