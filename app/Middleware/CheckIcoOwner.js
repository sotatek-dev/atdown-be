"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const Const = use('App/Common/Const');

class CheckIcoOwner {
  async handle({ request, auth }, next) {
    if(!auth.user){
      throw new ForbiddenException();
    }
    const role = auth.user.role;
    if (!role || (role !== Const.USER_ROLE.ICO_OWNER)) {
      throw new ForbiddenException();
    }
    await next();
  }
}

module.exports = CheckIcoOwner;
