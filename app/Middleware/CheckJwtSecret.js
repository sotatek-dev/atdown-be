"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const UserModel = use('App/Models/User')

class CheckJwtSecret {
  async handle({ request, auth }, next) {
    // if(!auth.user){
    //   throw new ForbiddenException();
    // }
    // const user = await UserModel.query().where('id', auth.user.id).first();
    // const jwtUser = await auth.jwtPayload.data;
    // if (!user || (user.token_jwt !== jwtUser.token_jwt)) {
    //   throw new ForbiddenException();
    // }
    await next();
  }
}

module.exports = CheckJwtSecret;
