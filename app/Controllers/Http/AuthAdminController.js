'use strict'

const AuthAdminService = use('App/Services/AuthAdminService');
const AdminService = use('App/Services/AdminService');
const HelperUtils = use('App/Common/HelperUtils');
const Const = use('App/Common/Const');
const Web3 = require('web3')

class AuthAdminController {

  async verifyJwtToken({request, auth}) {
    try {
      const isValid = await auth.check();
      const authUser = await auth.jwtPayload.data;
      const dbUser = await (new AdminService).findUser(authUser);
      if (isValid && authUser && dbUser && dbUser.type === Const.USER_TYPE.WHITELISTED) {
        return HelperUtils.responseSuccess({
          msgCode: 'TOKEN_IS_VALID'
        }, 'Token is valid');
      }

      if (dbUser && dbUser.type === Const.USER_TYPE.REGULAR) {
        return HelperUtils.responseSuccess({
          msgCode: 'USER_IS_NOT_IN_WHITELISTED'
        }, 'User is not in white list');
      }

      return HelperUtils.responseSuccess({
        msgCode: 'TOKEN_IS_INVALID'
      }, 'Token is invalid');
    } catch (e) {
      console.log('ERROR: ', e);
      return HelperUtils.responseErrorInternal({
        msgCode: 'TOKEN_IS_INVALID'
      }, 'ERROR: Token is invalid');
    }
  }

  async checkWalletAddress({request, params}) {
    try {
      const inputs = request.all();
      const walletAddress = HelperUtils.checkSumAddress(inputs.wallet_address || ' ');
      const adminService = new AdminService();

      console.log('Wallet: ', walletAddress);
      console.log('Check Wallet: ', inputs, params);
      const user = await adminService.findUser({
        wallet_address: walletAddress,
        // role: params.type === Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER,
      });

      if (!user) {
        return HelperUtils.responseNotFound('Not exist !')
      }

      return HelperUtils.responseSuccess({
        walletAddress,
        user: {
          id: user.id
        },
      });
    } catch (e) {
      console.log('ERROR: ', e);
      return HelperUtils.responseErrorInternal('ERROR: Wallet address is invalid');
    }
  }

  async login({request, auth, params}) {
    const type = params.type;
    if (type !== Const.USER_TYPE_PREFIX.ICO_OWNER && type !== Const.USER_TYPE_PREFIX.PUBLIC_USER) {
      return HelperUtils.responseNotFound('Not valid !');
    }
    const param = request.all();
    const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address)
    try {
      const authService = new AuthAdminService();
      const user = await authService.login({
        'wallet_address': wallet_address,
        role: Const.USER_ROLE.ICO_OWNER,
      });

      const token = await auth.authenticator('admin').generate(user, true);
      return HelperUtils.responseSuccess({
        user,
        token,
      });
    } catch (e) {
      console.log('ERROR: ', e);
      return HelperUtils.responseNotFound('ERROR: login fail !');
    }
  }

  async adminRegister({ request, auth, params }) {
    try {
      const param = request.only(['email', 'username', 'signature', 'password', 'wallet_address'])
      const wallet_address = Web3.utils.toChecksumAddress(request.input('wallet_address'));
      param.wallet_address = wallet_address;

      const type = params.type;
      const role = type === Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER;

      const authService = new AuthAdminService();
      let user = await authService.checkIssetUser({ email: param.email, role });
      console.log(user);
      if(!user) {
        user = await authService.checkWalletUser({wallet_address, role});
        if(user){
          return HelperUtils.responseNotFound('The current ethereum address has been used.');
        }
        user = await authService.createUser({
          ...param,
          role,
        });
      } else {
        return HelperUtils.responseNotFound(' Email address has been used.');
      }
      user.confirmation_token = await HelperUtils.randomString(50);
      user.save();
      await authService.sendConfirmEmail({ role, type, user });

      return HelperUtils.responseSuccess(null, 'Success! Please confirm email to complete.');
    } catch(e) {
      console.log('ERROR: ', e);
      return HelperUtils.responseErrorInternal(e.message);
    }
  }
}

module.exports = AuthAdminController;
