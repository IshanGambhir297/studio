'use server';

/**
 * @fileOverview A unified flow for processing a user's message.
 * It analyzes sentiment, checks for distress, and generates a supportive reply in a single call.
 *
 * - processUserMessage - The main function to process the message.
 * - ProcessUserMessageInput - The input type for the processUserMessage function.
 * - ProcessUserMessageOutput - The return type for the processUserMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessUserMessageInputSchema = z.object({
  message: z.string().describe('The user message to process.'),
});
export type ProcessUserMessageInput = z.infer<typeof ProcessUserMessageInputSchema>;

const ProcessUserMessageOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the message (happy, sad, anxious, stressed, neutral, severe_distress).'
    ),
  isDistress: z
    .boolean()
    .describe('A boolean value indicating if the message suggests severe distress.'),
  aiMessage: z
    .string()
    .describe(
      'The generated supportive reply from the AI. Should be an empty string if sentiment is happy or neutral.'
    ),
});
export type ProcessUserMessageOutput = z.infer<typeof ProcessUserMessageOutputSchema>;

export async function processUserMessage(
  input: ProcessUserMessageInput
): Promise<ProcessUserMessageOutput> {
  return processUserMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processUserMessagePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: ProcessUserMessageInputSchema},
  output: {schema: ProcessUserMessageOutputSchema},
  prompt: `You are a mental health assistant. Your tone should be empathetic and understanding.
Analyze the following user message and generate a response.

You must perform three tasks:
1.  **Analyze Sentiment**: Determine the sentiment of the message. The possible sentiments are: happy, sad, anxious, stressed, neutral. If the user expresses thoughts of self-harm, suicide, or any other indication of severe emotional crisis, set the sentiment to "severe_distress".
2.  **Detect Distress**: Based on the sentiment analysis, if the sentiment is "severe_distress", set the "isDistress" output field to true. Otherwise, set it to false.
3.  **Generate Reply**:
    *   If the sentiment is 'sad', 'anxious', or 'stressed', generate a short, supportive reply (one or two sentences).
    *   If the sentiment is 'happy', 'neutral', or 'severe_distress', return an empty string for the 'aiMessage'. For severe distress, a separate mechanism will provide a helpline, so do not generate a message here.

Never judge or dismiss the user's feelings.

Message: {{{message}}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const processUserMessageFlow = ai.defineFlow(
  {
    name: 'processUserMessageFlow',
    inputSchema: ProcessUserMessageInputSchema,
    outputSchema: ProcessUserMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
