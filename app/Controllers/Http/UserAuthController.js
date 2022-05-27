"use strict";

const AuthService = use("App/Services/AuthService");
const UserService = use("App/Services/UserService");
const HelperUtils = use("App/Common/HelperUtils");
const Const = use("App/Common/Const");
const Config = use("Config");
const Web3 = require("web3");
const UserModel = use("App/Models/User");

class UserAuthController {
  async verifyJwtToken({ request, auth }) {
    try {
      const isValid = await auth.check();
      const authUser = await auth.jwtPayload.data;
      const dbUser = await new UserService().findUser(authUser);
      if (
        isValid &&
        authUser &&
        dbUser &&
        dbUser.type === Const.USER_TYPE.WHITELISTED
      ) {
        return HelperUtils.responseSuccess(
          {
            msgCode: "TOKEN_IS_VALID",
          },
          "Token is valid"
        );
      }

      if (dbUser && dbUser.type === Const.USER_TYPE.REGULAR) {
        return HelperUtils.responseSuccess(
          {
            msgCode: "USER_IS_NOT_IN_WHITELISTED",
          },
          "User is not in white list"
        );
      }

      return HelperUtils.responseSuccess(
        {
          msgCode: "TOKEN_IS_INVALID",
        },
        "Token is invalid"
      );
    } catch (e) {
      console.log("ERROR: ", e);
      return HelperUtils.responseErrorInternal(
        {
          msgCode: "TOKEN_IS_INVALID",
        },
        "ERROR: Token is invalid"
      );
    }
  }

  async checkWalletAddress({ request, params }) {
    try {
      const inputs = request.all();
      const walletAddress = HelperUtils.checkSumAddress(
        inputs.wallet_address || " "
      );
      const userService = new UserService();
      const user = await userService.findUser({
        wallet_address: walletAddress,
        // role: params.type === Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER,
      });
      if (!user) {
        return HelperUtils.responseNotFound("Not exist !");
      }
      return HelperUtils.responseSuccess({
        walletAddress,
        user: {
          id: user.id,
        },
      });
    } catch (e) {
      console.log("ERROR: ", e);
      return HelperUtils.responseErrorInternal(
        "ERROR: Wallet address is invalid"
      );
    }
  }

  async logout({ request, auth, params }) {
    try {
      const param = request.all();
      const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address);
      const authService = new AuthService();
      return await authService.logout(wallet_address);
    } catch (error) {
      return HelperUtils.responseNotFound(error);
    }
  }

  async login({ request, auth, params }) {
    try {
      const param = request.all();
      if(!param.player_id) return HelperUtils.responseNotFound("Player id must be required");
      const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address);
      const signature = param.signature;
      const authService = new AuthService();
      return await authService.login(wallet_address,signature, param.player_id);
    } catch (error) {
      return HelperUtils.responseNotFound(error);
    }

    // const type = params.type;
    // if (
    //   type !== Const.USER_TYPE_PREFIX.ICO_OWNER &&
    //   type !== Const.USER_TYPE_PREFIX.PUBLIC_USER
    // ) {
    //   return HelperUtils.responseNotFound("Not valid !");
    // }
    // const param = request.all();
    // const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address);
    // const filterParams = {
    //   wallet_address: wallet_address,
    // };
    // try {
    //   const authService = new AuthService();
    //   const user = await authService.login({
    //     ...filterParams,
    //   });

    //   const token = await auth.generate(user, true);
    //   return HelperUtils.responseSuccess({
    //     user,
    //     token,
    //   });
    // } catch (e) {
    //   console.log("ERROR: ", e);
    //   return HelperUtils.responseNotFound("ERROR: User login fail !");
    // }
  }

  async register({ request }) {
    try {
      const param = request.only([
        "email",
        "username",
        "signature",
        "password",
        "wallet_address",
        "role",
        "subscribe_status",
        "type",
        "player_id",
      ]);
      const wallet_address = Web3.utils.toChecksumAddress(
        request.input("wallet_address")
      );
      const role = Const.USER_ROLE.PUBLIC_USER;
      const subscribe_status = true;
      const authService = new AuthService();
      const user = await authService.checkWalletUser({ wallet_address, role });
      if (user) {
        return HelperUtils.responseNotFound(
          "The current ethereum address has been used."
        );
      }
      const result = await authService.createUser({
        email: param.email,
        username: param.username,
        signature: param.signature,
        password: param.password,
        wallet_address: param.wallet_address,
        role,
        type: Const.USER_TYPE.WHITELISTED,
        subscribe_status: param.subscribe_status,
        player_id: param.player_id,
      });
      // await authService.sendConfirmEmail({role, type, user});
      return HelperUtils.responseSuccess(null, "Success.");
    } catch (e) {
      return HelperUtils.responseErrorInternal(`ERROR: ${e} `);
    }
  }

  async registerVerifyEmail({ request, params }) {
    try {
      const param = request.only(["email", "signature", "wallet_address"]);
      const email = param.email;
      const role = Const.USER_ROLE.PUBLIC_USER; // Only public user verify email
      const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address);

      let checkExistEmail = await UserModel.query()
        .where("email", email)
        .where("status", Const.USER_STATUS.ACTIVE)
        .first();
      if (checkExistEmail) {
        return HelperUtils.responseBadRequest(
          "Email account has been registered."
        );
      }

      let checkExistWallet = await UserModel.query()
        .where("wallet_address", wallet_address)
        .where("status", Const.USER_STATUS.ACTIVE)
        .first();
      if (checkExistWallet) {
        return HelperUtils.responseBadRequest(
          "Your wallet has been verified email."
        );
      }

      console.log("[registerVerifyEmail]: Wallet Address: ", wallet_address);
      let user = await UserModel.query()
        .where("wallet_address", wallet_address)
        .first();
      console.log("[registerVerifyEmail]: User:  ", user);

      if (!user) {
        console.log("[registerVerifyEmail]: Create User:  ");
        user = new UserModel();
        user.email = param.email;
        user.username = param.email;
        user.password = param.email;
        user.wallet_address = wallet_address;
        user.signature = param.email;
        user.status = Const.USER_STATUS.UNVERIFIED; // Not verify email
        console.log("user.status", user.status);
        await user.save();
      }
      if (user.is_active === Const.USER_STATUS.ACTIVE) {
        return HelperUtils.responseBadRequest("User is actived!");
      }

      user.email = param.email;
      // TODO: Remove after
      user.status = Const.USER_STATUS.ACTIVE; // Auto active email
      // user.confirmation_token = await HelperUtils.randomString(50);

      await user.save();

      console.log("[registerVerifyEmail]: SendEmail:  ", param);
      const authService = new AuthService();
      await authService.sendNewVerifyEmail({ user });

      // return HelperUtils.responseSuccess(null, 'Success! Register email success');
      return HelperUtils.responseSuccess(
        null,
        "You can start staking now. Please use this same email when doing KYC."
      );
    } catch (e) {
      console.log("ERROR: ", e);
      return HelperUtils.responseErrorInternal(
        "ERROR: User verify email fail !"
      );
    }
  }
}

module.exports = UserAuthController;
