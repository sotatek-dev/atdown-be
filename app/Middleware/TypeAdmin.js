"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const Const = use('App/Common/Const');

class TypeAdmin {
  async handle({ request, params, args }, next) {
    request.params.type = Const.USER_TYPE_PREFIX.ICO_OWNER;
    console.log('TypeAdmin', request.params);

    await next();
  }
}

module.exports = TypeAdmin;
