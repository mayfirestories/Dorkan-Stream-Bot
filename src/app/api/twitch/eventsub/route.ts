import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import twitchBot from '@/twitch/twitchBot';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Twitch-Eventsub-Message-Signature');
    const timestamp = request.headers.get('Twitch-Eventsub-Message-Timestamp');
    const messageId = request.headers.get('Twitch-Eventsub-Message-Id');
    const secret = process.env.TWITCH_EVENTSUB_SECRET;

    const rawBody = await request.text();

    if (!signature || !timestamp || !messageId || !secret) {
      return NextResponse.json({ message: 'Missing required headers or secret' }, { status: 400 });
    }

    const messageToSign = messageId + timestamp + rawBody;
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(messageToSign).digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid signature received');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Received Twitch EventSub notification:', body);

    if (body.subscription.type === 'channel.follow') {
      const userName = body.event.user_name;
      console.log(`New follower: ${userName}`);
      twitchBot.onFollow(userName);
    }

 return NextResponse.json({ message: 'Notification received' }, { status: 200 });
  } catch (error) {
    console.error('Error processing Twitch EventSub notification:', error);
    return NextResponse.json({ message: 'Error processing notification' }, { status: 500 });
  }
}