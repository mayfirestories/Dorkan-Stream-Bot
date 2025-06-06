'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview This flow generates conversational snippets that acknowledge viewer activity such as donations and follows.
 *
 * - generateResponse - A function that generates a response based on viewer activity.
 * - GenerateResponseInput - The input type for the generateResponse function.
 * - GenerateResponseOutput - The return type for the generateResponse function.
 */

const GenerateResponseInputSchema = z.object({
  activityType: z
    .enum(['donation', 'follow', 'subscription','raid'])
    .describe('The type of viewer activity.'),
  userName: z.string().describe('The name of the user who triggered the activity.'),
  amount: z.number().optional().describe('The amount of the donation, if applicable.'),
});
export type GenerateResponseInput = z.infer<typeof GenerateResponseInputSchema>;

const GenerateResponseOutputSchema = z.object({
  response: z.string().describe('A conversational snippet acknowledging the user and their contribution.'),
});
export type GenerateResponseOutput = z.infer<typeof GenerateResponseOutputSchema>;

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  return generateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {schema: GenerateResponseInputSchema},
  output: {schema: GenerateResponseOutputSchema},
  prompt: `You are a streaming engagement bot named Dorkan. You are talking to a streamer, and your goal is to engage the streamer and thank users for their activity.

  A user named {{userName}} has performed the following activity: {{activityType}}.

  {{#if amount}}
  They donated {{amount}}!
  {{/if}}

  Generate a short, conversational snippet to acknowledge the user and their contribution. Keep it witty and humorous.
  `,
});

const generateResponseFlow = ai.defineFlow(
  {
    name: 'generateResponseFlow',
    inputSchema: GenerateResponseInputSchema,
    outputSchema: GenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
