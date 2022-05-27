"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const AdminModel = use('App/Models/Admin')

class CheckAdminJwtSecret {
  async handle({ request, auth }, next) {

    console.log('Admin User: ', auth.jwtPayload);
    if(!auth || !auth.jwtPayload || !auth.jwtPayload.data){
      throw new ForbiddenException();
    }

    const user = await AdminModel.query().where('id', auth.jwtPayload.data.id).first();
    const jwtUser = await auth.jwtPayload.data;
    if (!user || (user.token_jwt !== jwtUser.token_jwt)) {
      throw new ForbiddenException();
    }
    await next();
  }
}

module.exports = CheckAdminJwtSecret;
