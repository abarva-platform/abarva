import { CookieJar } from './cookieJar.mjs';

export class ClerkTicketSession {
  constructor({
    browser,
    clerk,
    baseUrl,
    personaEmail,
    activeClient,
    ticketTtlSeconds = 300,
    headless = true,
  }) {
    this.browser = browser;
    this.clerk = clerk;
    this.baseUrl = baseUrl;
    this.baseHost = new URL(baseUrl).hostname;
    this.personaEmail = personaEmail;
    this.activeClient = activeClient;
    this.ticketTtlSeconds = ticketTtlSeconds;
    this.headless = headless;
    this.userId = null;
  }

  async resolveUserId() {
    if (this.userId) return this.userId;
    const users = await this.clerk.users.getUserList({ emailAddress: [this.personaEmail], limit: 1 });
    const user = users.data?.[0];
    if (!user) throw new Error(`No Clerk user found for ${this.personaEmail}`);
    this.userId = user.id;
    return this.userId;
  }

  async createCookieJar() {
    const userId = await this.resolveUserId();
    const token = await this.clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: this.ticketTtlSeconds,
    });

    const context = await this.browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30000 });
      await page.evaluate(async (ticket) => {
        const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
        if (result.status !== 'complete' || !result.createdSessionId) {
          throw new Error(`Ticket sign-in failed: ${result.status}`);
        }
        await window.Clerk.setActive({ session: result.createdSessionId });
      }, token.token);

      await context.addCookies([{
        name: 'abarva_active_client',
        value: this.activeClient,
        domain: this.baseHost,
        path: '/',
        sameSite: 'Lax',
        secure: this.baseUrl.startsWith('https://'),
      }]);

      return new CookieJar(await context.cookies(this.baseUrl));
    } finally {
      await context.close();
    }
  }
}
