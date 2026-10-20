import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ 
    success: false, 
    error: 'Paytm Smart Box has been disabled.' 
  }, { status: 410 });
}
