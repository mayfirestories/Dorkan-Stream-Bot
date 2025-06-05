'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview A flow to generate talking points for a streamer based on the game they are playing.
 *
 * - generateTalkingPoints - A function that generates talking points for a streamer.
 * - GenerateTalkingPointsInput - The input type for the generateTalkingPoints function.
 * - GenerateTalkingPointsOutput - The return type for the generateTalkingPoints function.
 */

const GenerateTalkingPointsInputSchema = z.object({
  gameName: z.string().describe('The name of the game being streamed.'),
  streamDescription: z
    .string()
    .describe('A description of the current stream, including current events in the game.'),
});

export type GenerateTalkingPointsInput = z.infer<typeof GenerateTalkingPointsInputSchema>;

const GenerateTalkingPointsOutputSchema = z.object({
  talkingPoints: z.array(z.string()).describe('An array of talking points for the streamer.'),
});

export type GenerateTalkingPointsOutput = z.infer<typeof GenerateTalkingPointsOutputSchema>;

export async function generateTalkingPoints(
  input: GenerateTalkingPointsInput
): Promise<GenerateTalkingPointsOutput> {
  return generateTalkingPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTalkingPointsPrompt',
  input: {schema: GenerateTalkingPointsInputSchema},
  output: {schema: GenerateTalkingPointsOutputSchema},
  prompt: `You are a streaming engagement bot that provides talking points to streamers.

You are watching a stream of {{gameName}}. The streamer has provided the following description of the stream:

{{streamDescription}}

Based on this information, generate 3-5 talking points that the streamer can use to keep the conversation flowing. These talking points should be specific and engaging, and related to the current game and stream events.

Talking Points:
`, 
});

const generateTalkingPointsFlow = ai.defineFlow(
  {
    name: 'generateTalkingPointsFlow',
    inputSchema: GenerateTalkingPointsInputSchema,
    outputSchema: GenerateTalkingPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
