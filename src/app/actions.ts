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
import { auth } from 'firebase-admin';

const sendMessageSchema = z.object({
  message: z.string().min(1),
  userId: z.string().min(1, { message: 'User must be authenticated.' }),
});

export async function sendMessageAction(formData: FormData) {
  const rawData = {
    message: formData.get('message'),
    userId: formData.get('userId'),
  };

  const validatedFields = sendMessageSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input.',
    };
  }

  const { message, userId } = validatedFields.data;

  try {
    const { sentiment, isDistress, aiMessage } = await processUserMessage({ message });

    let referralMessage = '';
    if (isDistress) {
      referralMessage = "⚠️ Please reach out to a professional. Helpline: +91-9876543210";
    }

    await addDoc(collection(db, 'conversations'), {
      userId: userId,
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

const deleteHistorySchema = z.object({
  userId: z.string().min(1, { message: 'User must be authenticated.' }),
});

export async function deleteHistoryAction(formData: FormData) {
  const rawData = {
    userId: formData.get('userId'),
  };

  const validatedFields = deleteHistorySchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input.',
    };
  }
  
  const { userId } = validatedFields.data;

  try {
    const q = query(collection(db, 'conversations'), where('userId', '==', userId));
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
