'use server';

/**
 * @fileOverview A flow for analyzing the sentiment of user messages.
 *
 * - analyzeUserSentiment - Analyzes the sentiment of a user message.
 * - AnalyzeUserSentimentInput - The input type for the analyzeUserSentiment function.
 * - AnalyzeUserSentimentOutput - The return type for the analyzeUserSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserSentimentInputSchema = z.object({
  message: z.string().describe('The user message to analyze.'),
});
export type AnalyzeUserSentimentInput = z.infer<typeof AnalyzeUserSentimentInputSchema>;

const AnalyzeUserSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the message (happy, sad, anxious, stressed, neutral).' + 
      'If the message indicates severe distress, set to \'severe_distress\'.' 
    ),
  isDistress: z.boolean().describe('A boolean value indicating if the message suggests severe distress'),
});
export type AnalyzeUserSentimentOutput = z.infer<typeof AnalyzeUserSentimentOutputSchema>;

export async function analyzeUserSentiment(input: AnalyzeUserSentimentInput): Promise<AnalyzeUserSentimentOutput> {
  return analyzeUserSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserSentimentPrompt',
  input: {schema: AnalyzeUserSentimentInputSchema},
  output: {schema: AnalyzeUserSentimentOutputSchema},
  prompt: `You are a mental health assistant. Analyze the sentiment of the following user message.  The possible sentiments are: happy, sad, anxious, stressed, neutral.  If the user expresses thoughts of self-harm or suicide, or any other indication of severe distress, set the sentiment to "severe_distress" and isDistress to true.

Message: {{{message}}}`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  }
});

const analyzeUserSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeUserSentimentFlow',
    inputSchema: AnalyzeUserSentimentInputSchema,
    outputSchema: AnalyzeUserSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
