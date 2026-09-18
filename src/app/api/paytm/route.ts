import { NextResponse } from 'next/server';
const PaytmChecksum = require('paytmchecksum');

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

    // 1. Prepare Paytm API Payload
    const paytmParams: any = {};
    
    paytmParams.body = {
        "mid"           : MID,
        "orderId"       : orderId,
        "amount"        : amount.toString(),
        "businessType"  : "UPI_QR_CODE",
        "posId"         : TID
    };

    // 2. Generate Checksum using your Merchant Key
    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MKEY);
    paytmParams.head = {
        "clientId"  : "C11",
        "version"   : "v1",
        "signature" : checksum
    };

    console.log(`[PAYTM API] Pushing ₹${amount} to Terminal ${TID} for Order ${orderId}...`);

    // 3. Call Paytm Cloud POS API
    const response = await fetch('https://securegw.paytm.in/paymentservices/qr/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paytmParams)
    });

    const responseData = await response.json();
    console.log("[PAYTM RESPONSE]:", responseData);

    // Check if Paytm accepted the push
    if (responseData.body && responseData.body.resultInfo && responseData.body.resultInfo.resultStatus === "SUCCESS") {
        return NextResponse.json({ 
          success: true, 
          message: "Pushed to Paytm Smart Box successfully!" 
        });
    } else {
        const errorMsg = responseData.body?.resultInfo?.resultMsg || "Failed to push to device";
        return NextResponse.json({ 
          success: false, 
          error: errorMsg 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Paytm API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
