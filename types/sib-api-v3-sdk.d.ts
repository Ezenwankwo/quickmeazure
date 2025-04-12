declare module 'sib-api-v3-sdk' {
  namespace ApiClient {
    const instance: any;
  }

  interface SendSmtpEmail {
    subject: string;
    htmlContent: string;
    textContent?: string;
    sender: {
      name: string;
      email: string;
    };
    to: Array<{
      email: string;
      name?: string;
    }>;
    replyTo?: {
      email: string;
      name?: string;
    };
    headers?: Record<string, string>;
    params?: Record<string, any>;
  }

  class SendSmtpEmail {
    constructor();
  }

  class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<{ messageId: string }>;
  }
} 