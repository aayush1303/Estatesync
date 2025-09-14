import { auth, clerkClient } from '@clerk/nextjs/server';

export async function isUserAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    
    return userEmail === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function getUserEmail(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.emailAddresses?.[0]?.emailAddress || null;
  } catch {
    return null;
  }
}