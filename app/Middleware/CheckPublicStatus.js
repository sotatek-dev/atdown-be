"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const Const = use('App/Common/Const');

class CheckStatus {
  async handle({ request }, next) {
    const status = request.params.status
    if (status !== 'current' && status !== 'upcoming' && status !== 'past')
      throw new ForbiddenException();
    await next();
  }
}

module.exports = CheckStatus;
