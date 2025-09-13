
'use server';

import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { analyzeUserSentiment } from '@/ai/flows/analyze-user-sentiment';
import { generateSupportiveReply } from '@/ai/flows/generate-supportive-replies';
import { referUserInDistress } from '@/ai/flows/refer-user-in-distress';
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
import { redirect } from 'next/navigation';

const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signUpWithEmail(formData: FormData) {
  const validatedFields = emailSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { error: 'Invalid email or password.' };
  }
  const { email, password } = validatedFields.data;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signInWithEmail(formData: FormData) {
  const validatedFields = emailSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { error: 'Invalid email or password.' };
  }
  const { email, password } = validatedFields.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return;
    }
    return { error: error.message };
  }
  redirect('/');
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    return { error: error.message };
  }
  redirect('/login');
}

const sendMessageSchema = z.object({
  message: z.string().min(1),
  userId: z.string().min(1),
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
    const sentimentResult = await analyzeUserSentiment({ message });

    let referralMessage = '';
    if (sentimentResult.isDistress) {
      const referralResult = await referUserInDistress({ message });
      if (referralResult.shouldRefer) {
        referralMessage = referralResult.referralMessage;
      }
    }

    const replyResult = await generateSupportiveReply({
      sentiment: sentimentResult.sentiment,
      userMessage: message,
    });
    const aiMessage = replyResult.reply;

    await addDoc(collection(db, 'conversations'), {
      userId,
      userMessage: message,
      aiMessage,
      sentiment: sentimentResult.sentiment,
      timestamp: Timestamp.now(),
    });

    revalidatePath('/chat');

    return {
      aiMessage,
      referralMessage,
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      error: 'An error occurred while processing your message. Please try again.',
    };
  }
}

export async function deleteHistoryAction(formData: FormData) {
  const userId = formData.get('userId');
  if (!userId || typeof userId !== 'string') {
    return { error: 'Invalid user.' };
  }

  try {
    const q = query(collection(db, 'conversations'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      revalidatePath('/chat');
      return {};
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    revalidatePath('/chat');
    return {};
  } catch (error) {
    console.error('Error deleting history:', error);
    return {
      error: 'An error occurred while deleting your history.',
    };
  }
}
