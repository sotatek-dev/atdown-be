'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const UserModel = use('App/Models/User');
const PasswordResetModel = use('App/Models/PasswordReset');
const randomString = use('random-string');
const Const = use('App/Common/Const');
const HelperUtils = use('App/Common/HelperUtils');

class UserService {
  buildQueryBuilder(params) {
    let builder = UserModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.username) {
      builder = builder.where('username', params.username);
    }
    if (params.email) {
      builder = builder.where('email', params.email);
    }
    if (params.signature) {
      builder = builder.where('signature', params.signature);
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', params.wallet_address);
    }
    if (params.type) {
      builder = builder.where('type', params.type);
    }
    if (params.role) {
      builder = builder.where('role', params.role);
    }
    if (params.confirmation_token) {
      builder = builder.where('confirmation_token', params.confirmation_token);
    }
    if (params.status !== undefined) {
      builder = builder.where('status', params.status);
    } else {
      builder = builder.where('status', Const.USER_STATUS.ACTIVE);
    }
    return builder;
  }

  buildSearchQuery(query, searchQuery) {
    return query.where((q) => {
      q.where('email', 'like', `%${searchQuery}%`)
        .orWhere('wallet_address', 'like', `%${searchQuery}%`);
    })
  }

  async findUser(params) {
    let builder = this.buildQueryBuilder(params);
    return await builder.first();
  }

  async updateUser(params, userAuthInfo) {
    let query = this.buildQueryBuilder(userAuthInfo);
    const result = await query.update(params);
    return result;
  }

  async resetPasswordEmail(email, role) {
    const oldRequest = await PasswordResetModel
      .query()
      .where('email', email)
      .where('role', role)
      .first();

    if (oldRequest) {
      await oldRequest.delete(this.trx);
    }
    const dateTime = Date.now();
    const token = randomString({ length: 40 });
    const newToken = new PasswordResetModel();
    newToken.email = email;
    newToken.token = token;
    newToken.role = role;
    newToken.time_expired = dateTime + Const.TIME_EXPIRED;
    await newToken.save(this.trx);

    return token;
  }

  async checkToken(token, role) {
    const tokenReset = await PasswordResetModel.query().where('token', token).where('role', role).first();
    if (tokenReset) {
      const timeExpired = tokenReset.time_expired;
      if (Date.now() < timeExpired) {
        return tokenReset;
      }
      ErrorFactory.badRequest('Forgot password link has expired');
    } else {
      ErrorFactory.notFound('Token is not found!');
    }
  }

  async confirmEmail(token) {
    const user = await this.findUser({
      confirmation_token: token,
      status: Const.USER_STATUS.UNVERIFIED,
    });
    console.log('user======>', JSON.stringify(user));
    if (!user) {
      // User not exist
      return false;
    }

    let userExist = await this.buildQueryBuilder({
      wallet_address: user.wallet_address,
      status: Const.USER_STATUS.ACTIVE,
    }).where('id', '!=', user.id).first();

    if (userExist) {
      await UserModel.query().where('id', user.id).delete();
      return false;
    }

    userExist = await this.buildQueryBuilder({
      email: user.email,
      status: Const.USER_STATUS.ACTIVE,
    }).where('id', '!=', user.id).first();

    if (userExist) {
      await UserModel.query().where('id', user.id).delete();
      return false;
    }

    console.log('========================');
    console.log('USER NEED VERIFY CONFIRM:');
    console.log(JSON.stringify(user));
    console.log('========================');
    console.log('USER ACTIVED EXIST:');
    console.log(JSON.stringify(userExist));
    console.log('========================');

    console.log('Confirm Email for USER ID', user.id);
    user.confirmation_token = null;
    user.status = Const.USER_STATUS.ACTIVE;
    user.save();
    return true;
  }
}

module.exports = UserService
