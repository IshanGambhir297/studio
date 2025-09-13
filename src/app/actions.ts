'use server';

import { z } from 'zod';
import { processUserMessage } from '@/ai/flows/process-user-message';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const GUEST_USER_ID = 'guest_user';

const sendMessageSchema = z.object({
  message: z.string().min(1),
});

export async function sendMessageAction(formData: FormData) {
  const rawData = {
    message: formData.get('message'),
  };

  const validatedFields = sendMessageSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input.',
    };
  }

  const { message } = validatedFields.data;

  try {
    const { sentiment, isDistress, aiMessage } = await processUserMessage({ message });

    let referralMessage = '';
    if (isDistress) {
      referralMessage = "⚠️ Please reach out to a professional. Helpline: +91-9876543210";
    }

    await addDoc(collection(db, 'conversations'), {
      userId: GUEST_USER_ID,
      userMessage: message,
      aiMessage,
      sentiment,
      timestamp: Timestamp.now(),
    });

    revalidatePath('/');

    return {
      aiMessage,
      referralMessage,
    };
  } catch (error) {
    console.error('Error processing message:', error);
    let errorMessage = 'An error occurred while processing your message. Please try again.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      error: errorMessage,
    };
  }
}

export async function deleteHistoryAction() {
  try {
    const q = query(collection(db, 'conversations'), where('userId', '==', GUEST_USER_ID));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      revalidatePath('/');
      return {};
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    revalidatePath('/');
    return {};
  } catch (error) {
    console.error('Error deleting history:', error);
    return {
      error: 'An error occurred while deleting your history.',
    };
  }
}
