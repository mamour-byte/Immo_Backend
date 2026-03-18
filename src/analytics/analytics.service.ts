import { Injectable, Logger } from '@nestjs/common';
import { PostHog } from 'posthog-node';

type CaptureArgs = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly client: PostHog | null;

  constructor() {
    const apiKey = process.env.POSTHOG_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (!apiKey) {
      this.client = null;
      this.logger.warn("POSTHOG_KEY n'est pas defini. Le tracking backend est desactive.");
      return;
    }

    this.client = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 10_000,
    });
  }

  capture(args: CaptureArgs) {
    if (!this.client) return;

    try {
      this.client.capture({
        distinctId: args.distinctId,
        event: args.event,
        properties: args.properties ?? {},
      });
    } catch (error) {
      this.logger.error('Erreur tracking PostHog backend', error as Error);
    }
  }
}

