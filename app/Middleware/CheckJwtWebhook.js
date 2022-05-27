"use strict";

const ErrorFactory = use('App/Common/ErrorFactory');

class CheckJwtWebhook {
  async handle({ request,  }, next) {
    const headers = request.headers();

    console.log('HEADER CheckJwtWebhook:', headers);
    console.log('headers.webhooktoken', headers.webhooktoken);
    console.log('process.env.WEBHOOK_API_TOKEN', process.env.WEBHOOK_API_TOKEN);

    const webhookToken = headers.webhooktoken;
    const webhookTokenEnv = process.env.WEBHOOK_API_TOKEN;
    if (!webhookToken || webhookToken !== webhookTokenEnv) {
      return  ErrorFactory.unauthorizedInputException("UnauthorizedInputException: Incorrect Token");
    }
    await next();
  }
}

module.exports = CheckJwtWebhook;
