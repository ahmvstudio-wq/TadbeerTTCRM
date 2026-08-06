// @ts-nocheck
import { config } from 'dotenv';
config({ path: '.env.local' });
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';

async function main() {
  try {
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'draft a reply to the lead objection about pricing' }],
      tools: {
        draft_reply_to_lead: {
          description: 'Draft an intelligent reply',
          parameters: z.object({ objection_type: z.enum(['pricing', 'general']) }),
          execute: async () => ({ message: 'I drafted the reply', data: 'Pricing is firm.' })
        }
      },
      maxSteps: 5
    });
    console.log("FINAL TEXT:", result.text);
    console.log("STEPS:", JSON.stringify(result.steps, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
