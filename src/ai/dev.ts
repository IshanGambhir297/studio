import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-user-sentiment.ts';
import '@/ai/flows/refer-user-in-distress.ts';
import '@/ai/flows/generate-supportive-replies.ts';
