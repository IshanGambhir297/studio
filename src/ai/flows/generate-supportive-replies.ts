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

const checkIfReplyIsNecessary = ai.defineTool({
  name: 'checkIfReplyIsNecessary',
  description: 'Check if a reply is necessary based on the user message and sentiment.',
  inputSchema: z.object({
    sentiment: z.string().describe("The sentiment of the user's message."),
    userMessage: z.string().describe('The user message to check.'),
  }),
  outputSchema: z.boolean().describe('True if a reply is necessary, false otherwise.'),
}, async (input) => {
  // Implement the logic to determine if a reply is necessary based on sentiment and message.
  // For example, only reply if the sentiment is negative or neutral.
  const negativeSentiment = ['sad', 'anxious', 'stressed'];
  if (negativeSentiment.includes(input.sentiment.toLowerCase())) {
    return true;
  }
  return false;
});

const generateSupportiveReplyPrompt = ai.definePrompt({
  name: 'generateSupportiveReplyPrompt',
  input: {schema: GenerateSupportiveReplyInputSchema},
  output: {schema: GenerateSupportiveReplyOutputSchema},
  tools: [checkIfReplyIsNecessary],
  prompt: `You are a mental health support chatbot. Generate a short, supportive reply (one or two sentences) to the user's message, given its sentiment.

  User Message: {{{userMessage}}}
  Sentiment: {{{sentiment}}}

  If the checkIfReplyIsNecessary tool returns false, then return an empty string.
  `,
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
    const isReplyNecessary = await checkIfReplyIsNecessary(input);
    if (!isReplyNecessary) {
      return { reply: '' };
    }

    const {output} = await generateSupportiveReplyPrompt(input);
    return output!;
  }
);
