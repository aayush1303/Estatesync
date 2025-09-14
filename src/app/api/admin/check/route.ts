import { NextResponse } from 'next/server';
import { isUserAdmin } from '../../../../utils/admin';

export async function GET() {
  try {
    const isAdmin = await isUserAdmin();
    return NextResponse.json({ isAdmin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}