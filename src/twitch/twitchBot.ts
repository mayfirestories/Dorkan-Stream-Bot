import * as tmi from 'tmi.js';
import { generateResponse, GenerateResponseInput } from '@/ai/flows/ask-interactive-questions';
import { ChatUserstate, SubMethods, SubUserstate } from 'tmi.js';

interface TwitchBotOptions {
  username: string;
  oauth: string;
  channels: string[];
}

class TwitchBot {
  private client: tmi.Client;

  constructor({ username, oauth, channels }: TwitchBotOptions) {
    this.client = new tmi.Client({
      identity: {
        username,
        password: oauth,
      },
      channels,
    });

    this.client.on('connected', this.onConnected.bind(this));
    this.client.on('cheer', this.onCheer.bind(this));
    this.client.on('subscription', this.onSubscription.bind(this));
    this.client.on('raided', this.onRaided.bind(this));
  }

  public onConnected(addr: string, port: number): void {
    console.log(`Twitch bot connected to ${addr}:${port}`);
  }

  public sendMessage(message: string): void {
    this.client.getChannels().forEach((channel: any) => {
      this.client.say(channel, message);
    });
  }

  public connect(): Promise<[string, number]> {
    return this.client.connect();
  }

  public async onCheer(channel: string, userstate: ChatUserstate, message: string): Promise<void> {
    console.log(`${userstate.username} cheered ${userstate.bits} bits in ${channel}: ${message}`);
    const input: GenerateResponseInput = {
      activityType: 'donation',
      userName: userstate.username || 'anonymous',
      amount: userstate.bits ? parseInt(userstate.bits, 10) : undefined,
    };
    await this.generateAndSendResponse(input);
  }

  public async onSubscription(channel: string, username: string, method: SubMethods, message: string, userstate: SubUserstate): Promise<void> {
    console.log(`${username} subscribed to ${channel}`);
    const input: GenerateResponseInput = {
      activityType: 'subscription',
      userName: username,
    };
    await this.generateAndSendResponse(input);
  }

  public async onRaided(channel: string, username: string, viewers: number): Promise<void> {
    console.log(`${username} raided the channel with ${viewers} viewers`);
    const input: GenerateResponseInput = {
      activityType: 'raid',
      userName: username,
    };
    await this.generateAndSendResponse(input);
  }

  public async onFollow(userName: string): Promise<void> {
    console.log(`${userName} followed the channel`);
    const input: GenerateResponseInput = {
      activityType: 'follow',
      userName: userName,
    };
    await this.generateAndSendResponse(input);
  }


  private async generateAndSendResponse(input: GenerateResponseInput): Promise<void> {
    try {
      const response = await generateResponse(input);
      if (response?.response) {
        this.sendMessage(response.response);
      }
    } catch (error) {
      console.error(`Error generating or sending response for ${input.activityType}:`, error);
    }
  }

  public async createEventSubSubscription(
    clientId: string,
    accessToken: string,
    broadcasterId: string,
    webhookUrl: string,
    secret: string,
  ): Promise<void> {
    const subscription = {
      type: 'channel.follow',
      version: '2',
      condition: {
        broadcaster_user_id: broadcasterId,
      },
      transport: {
        method: 'webhook',
        callback: webhookUrl,
        secret: secret,
      },
    };

    try {
      const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create EventSub subscription:', response.status, errorData);
        return;
      }

      const responseData = await response.json();
      console.log('EventSub subscription created successfully:', responseData);
    } catch (error) {
      console.error('Error creating EventSub subscription:', error);
    }
  }
}

const twitchBot = new TwitchBot({
  username: process.env.TWITCH_BOT_USERNAME || '',
  oauth: process.env.TWITCH_BOT_OAUTH || '',
  channels: [process.env.TWITCH_CHANNEL || ''],
});

twitchBot.connect();
export default twitchBot;