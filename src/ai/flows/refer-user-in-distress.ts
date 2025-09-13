'use server';
/**
 * @fileOverview Determines if a user is in severe distress and needs a referral to a helpline.
 *
 * - referUserInDistress - A function that checks for user distress and returns a referral message if needed.
 * - ReferUserInDistressInput - The input type for the referUserInDistress function.
 * - ReferUserInDistressOutput - The return type for the referUserInDistress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReferUserInDistressInputSchema = z.object({
  message: z.string().describe('The user message to analyze for distress.'),
});
export type ReferUserInDistressInput = z.infer<typeof ReferUserInDistressInputSchema>;

const ReferUserInDistressOutputSchema = z.object({
  shouldRefer: z.boolean().describe('Whether the user should be referred to a helpline.'),
  referralMessage: z
    .string()
    .describe('The message to display to the user if they should be referred.'),
});
export type ReferUserInDistressOutput = z.infer<typeof ReferUserInDistressOutputSchema>;

export async function referUserInDistress(input: ReferUserInDistressInput): Promise<ReferUserInDistressOutput> {
  return referUserInDistressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'referUserInDistressPrompt',
  input: {schema: ReferUserInDistressInputSchema},
  output: {schema: ReferUserInDistressOutputSchema},
  prompt: `You are an AI assistant designed to detect severe distress in user messages.

  Analyze the following message and determine if the user is in severe distress and needs immediate help.

  Message: {{{message}}}

  Respond with JSON. The "shouldRefer" field must be true if the user expresses thoughts of self-harm, suicide, or severe emotional crisis.
  The referralMessage should contain the following text: "⚠️ Please reach out to a professional. Helpline: +91-9876543210" if shouldRefer is true.
  Otherwise, shouldRefer is false and referralMessage is an empty string.

  Ensure that the output is valid JSON and nothing else. Do not include any extra text or explanation.
  Here is the output JSON schema:
  {
    "shouldRefer": boolean,
    "referralMessage": string
  }
  `,
  config: {
    model: 'googleai/gemini-2.5-flash',
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const referUserInDistressFlow = ai.defineFlow(
  {
    name: 'referUserInDistressFlow',
    inputSchema: ReferUserInDistressInputSchema,
    outputSchema: ReferUserInDistressOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
