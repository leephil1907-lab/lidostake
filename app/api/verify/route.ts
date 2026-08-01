import { NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';

export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json({ success: false, error: 'Missing message or signature' }, { status: 400 });
    }

    // Extract address from message (SIWE format)
    const addressMatch = message.match(/^(?:[^\n]*\n)?([^\n]+)/);
    const claimedAddress = addressMatch ? addressMatch[1].trim() : '';

    // Verify signature
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    return NextResponse.json({ success: true, address: recoveredAddress });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
