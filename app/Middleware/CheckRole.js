"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const Const = use('App/Common/Const');

class CheckRole {
  async handle({ request, response, auth }, next, props) {

    // const role = Const.USER_ROLE.PUBLIC_USER;
    const role = request.params.type == Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER :  Const.USER_ROLE.PUBLIC_USER;
    console.log('CheckRole', auth.user.role, role);
    console.log('props: ', props);

    if (!auth.user.role || auth.user.role !== role) {
      // throw new ForbiddenException();
      return response.status(200).json({
        status: 403,
        message: 'Forbidden',
        url: request.url(),
      });
    }
    await next();
  }
}

module.exports = CheckRole;
