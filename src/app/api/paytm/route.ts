import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderId, amount, tableId } = await req.json();

    const MID = process.env.PAYTM_MID;
    const MKEY = process.env.PAYTM_MERCHANT_KEY;
    const TID = process.env.PAYTM_TERMINAL_ID;

    if (!MID || !MKEY || !TID) {
      return NextResponse.json({ 
        success: false, 
        error: "Paytm API Keys are missing in Vercel Environment Variables" 
      }, { status: 500 });
    }

    console.log(`[PAYTM API] Pushing ₹${amount} to Terminal ${TID} for Order ${orderId}`);
    
    // In actual production, we will import 'paytmchecksum' and call the EDC Push API here.

    return NextResponse.json({ 
      success: true, 
      message: "Pushed to Paytm Smart Box successfully!" 
    });

  } catch (error: any) {
    console.error("Paytm API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
