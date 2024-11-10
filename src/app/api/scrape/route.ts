// src/app/api/scrape.ts
import { NextRequest, NextResponse } from 'next/server';
import cheerio from 'cheerio';

async function scrapeWebsite(url: string) {
  try {
    // Using fetch directly without importing node-fetch
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract meta tags, title, Open Graph data
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const title = $('title').text();
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';

    return {
      title,
      metaDescription,
      ogTitle,
      ogDescription,
    };
  } catch (error) {
    console.error('Error scraping website:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const data = await scrapeWebsite(url);
  if (!data) {
    return NextResponse.json({ error: 'Failed to scrape website' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
