"use strict";
const Database = use("Database");
const UserDeviceModel = use("App/Models/UserDevice");
const UserModel = use("App/Models/User");
const HelperUtils = use("App/Common/HelperUtils");
const UserService = use("App/Services/UserService");
const Const = use("App/Common/Const");

class UserDeviceService {
  async subscribeNotification(wallet_address, subscribe_status, player_id) {
    const userService = new UserService();
    const filterParams = {
      wallet_address,
    };
    const isExistedUser = await userService.findUser(filterParams);
    if (!isExistedUser) {
      const trx = await Database.beginTransaction();
      try {
        const user = new UserModel();
        user.wallet_address = wallet_address;
        user.signature = null;
        user.role = Const.USER_ROLE.PUBLIC_USER;
        user.type = Const.USER_TYPE.WHITELISTED;
        user.status = Const.USER_STATUS.ACTIVE;
        await user.save(trx);
        const userDevice = new UserDeviceModel();
        userDevice.user_id = user.id;
        userDevice.player_id = player_id;
        userDevice.login_status = true;
        userDevice.login_at = new Date();
        userDevice.subscribe_status = true;
        await userDevice.save(trx);
        trx.commit();
        return {
          success: result,
        };
      } catch (error) {
        await trx.rollback();
        return HelperUtils.responseNotFound(error);
      }
    }
    const userDevice = await UserDeviceModel.query()
      .leftOuterJoin("users", (query) => {
        query.on("users.id", "=", "user_devices.user_id");
      })
      .where("users.wallet_address", wallet_address)
      .select("user_devices.*")
      .first();
    userDevice.subscribe_status = subscribe_status;
    if (subscribe_status) {
      userDevice.player_id = player_id;
    }
    const result = await userDevice.save();
    return {
      success: result,
    };
  }
}

module.exports = UserDeviceService;
