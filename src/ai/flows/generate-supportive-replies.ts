'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating supportive replies based on user message sentiment.
 *
 * The flow takes a sentiment and a user message as input and returns a supportive AI reply.
 * It uses the Gemini API to generate the reply.
 *
 * @exports {
 *   generateSupportiveReply,
 *   GenerateSupportiveReplyInput,
 *   GenerateSupportiveReplyOutput
 * }
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateSupportiveReplyInputSchema = z.object({
  sentiment: z
    .string()
    .describe("The sentiment of the user's message (e.g., happy, sad, anxious, stressed)."),
  userMessage: z.string().describe('The user message to generate a supportive reply for.'),
});

export type GenerateSupportiveReplyInput = z.infer<typeof GenerateSupportiveReplyInputSchema>;

const GenerateSupportiveReplyOutputSchema = z.object({
  reply: z.string().describe('The generated supportive reply from the AI.'),
});

export type GenerateSupportiveReplyOutput = z.infer<typeof GenerateSupportiveReplyOutputSchema>;

const generateSupportiveReplyPrompt = ai.definePrompt({
  name: 'generateSupportiveReplyPrompt',
  input: {schema: GenerateSupportiveReplyInputSchema},
  output: {schema: GenerateSupportiveReplyOutputSchema},
  prompt: `You are a mental health support chatbot. Your tone should be empathetic and understanding. Generate a short, supportive reply (one or two sentences) to the user's message, based on its sentiment.

User Message: {{{userMessage}}}
Sentiment: {{{sentiment}}}

Only generate a reply if the sentiment is 'sad', 'anxious', or 'stressed'. For any other sentiment (like 'happy' or 'neutral'), you must return an empty string for the reply. Never judge or dismiss the user's feelings.
`,
  config: {
    model: googleAI.model('gemini-1.5-flash'),
  },
});

/**
 * Generates a supportive reply based on the user's message and sentiment.
 * @param input The input containing the sentiment and user message.
 * @returns The generated supportive reply.
 */
export async function generateSupportiveReply(input: GenerateSupportiveReplyInput): Promise<GenerateSupportiveReplyOutput> {
  return generateSupportiveReplyFlow(input);
}

const generateSupportiveReplyFlow = ai.defineFlow(
  {
    name: 'generateSupportiveReplyFlow',
    inputSchema: GenerateSupportiveReplyInputSchema,
    outputSchema: GenerateSupportiveReplyOutputSchema,
  },
  async input => {
    if (!['sad', 'anxious', 'stressed'].includes(input.sentiment)) {
      return { reply: '' };
    }
    const {output} = await generateSupportiveReplyPrompt(input);
    return output!;
  }
);
