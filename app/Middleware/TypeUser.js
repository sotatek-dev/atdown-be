"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const Const = use('App/Common/Const');

class TypeUser {
  async handle({ request, params, args }, next) {
    request.params.type = Const.USER_TYPE_PREFIX.PUBLIC_USER;
    console.log('TypeUser', request.params);
    await next();
  }
}

module.exports = TypeUser;
