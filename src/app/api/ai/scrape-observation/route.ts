import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function fetchAndExtractContent(url: string): Promise<string> {
  try {
    const isInstagram = url.includes('instagram.com');
    
    // Simple fetch with generic user-agent to bypass basic blocks
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // short timeout
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    if (isInstagram) {
      // Instagram usually has meta tags for description
      const metaDescription = $('meta[property="og:description"]').attr('content') || '';
      const title = $('title').text() || '';
      return `Instagram Profile: ${title}. Bio/Description: ${metaDescription}`;
    }

    // For standard websites, remove scripts, styles, nav, footers
    $('script, style, noscript, iframe, img, svg, footer, header, nav').remove();
    
    // Extract text from main content areas or just body
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
      
    // Limit to first 3000 chars to save tokens
    return text.substring(0, 3000);
  } catch (error) {
    console.error("Scraping error:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, companyName, industry } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const scrapedContent = await fetchAndExtractContent(url);
    
    if (!scrapedContent) {
      return NextResponse.json({ error: 'Could not extract meaningful content from the provided URL' }, { status: 422 });
    }

    const prompt = `You are an expert B2B sales analyst. 
I have scraped the website/profile of a company named "${companyName}" in the "${industry || 'general'}" industry.
    
Here is the extracted content from their website/profile:
---
${scrapedContent}
---

Your task:
Write a single, highly specific, positive observation (maximum 15 words) about their recent work, product, or offering based strictly on the content above. 
This observation will be used in a cold outreach email right after saying "I was looking into ${companyName} and noticed...".
Do not include quotation marks, do not include greetings or intro text. ONLY output the exact observation text.
Example good outputs:
- your recent expansion of the summer collection
- the new sustainable sourcing initiative you launched
- how you streamline multi-branch retail operations
- your strong focus on corporate event design`;

    let observation = "";

    // Prefer OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const { generateText } = await import('ai');
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const result = await generateText({
        model: openai('gpt-4o-mini'), // fast and cheap model for this
        prompt: prompt,
      });
      observation = result.text.trim();
    } else if (process.env.GROQ_API_KEY) {
      const { createGroq } = await import('@ai-sdk/groq');
      const { generateText } = await import('ai');
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      
      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        prompt: prompt,
      });
      observation = result.text.trim();
    } else {
      return NextResponse.json({ error: 'No AI provider configured (missing OPENAI_API_KEY or GROQ_API_KEY)' }, { status: 500 });
    }
    
    // Cleanup AI output just in case
    observation = observation.replace(/^"|"$/g, '').trim();

    return NextResponse.json({ observation });
  } catch (error) {
    console.error('AI Scrape Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
