'use server';

import { z } from 'zod';
import { analyzeUserSentiment } from '@/ai/flows/analyze-user-sentiment';
import { generateSupportiveReply } from '@/ai/flows/generate-supportive-replies';
import { referUserInDistress } from '@/ai-flows/refer-user-in-distress';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  setDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { updateProfile } from 'firebase/auth';

const sendMessageSchema = z.object({
  message: z.string().min(1),
  userId: z.string(),
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

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth.',
  }),
  phone: z.string().optional(),
});

export async function updateUserProfileAction(prevState: any, formData: FormData) {
  if (!auth.currentUser) {
    return { error: 'You must be logged in to update your profile.' };
  }

  const rawData = {
    fullName: formData.get('fullName'),
    dob: formData.get('dob'),
    phone: formData.get('phone'),
  };

  const validatedFields = profileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, dob, phone } = validatedFields.data;

  try {
    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, {
      displayName: fullName,
    });

    // Update Firestore user document
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      fullName,
      dob,
      phone,
    }, { merge: true });

    revalidatePath('/profile');
    revalidatePath('/chat');

    return {
      success: 'Profile updated successfully!',
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      error: 'An error occurred while updating your profile.',
    };
  }
}
