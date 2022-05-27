"use strict";
const axios = use("axios");
const HelperUtils = use("App/Common/HelperUtils");
const UserDeviceService = use("App/Services/UserDeviceService");
const Web3 = require("web3");
class UserDeviceController {

  async subscribeNotification({ request, auth, params }) {
    try {
      const param = request.all();
      // if(!param.player_id) return HelperUtils.responseNotFound("Player id must be required");
      const wallet_address = Web3.utils.toChecksumAddress(param.wallet_address);
      const userDeviceService = new UserDeviceService();
      const result = await userDeviceService.subscribeNotification(wallet_address, param.subscribe_status, param.player_id);
      return result;
    } catch (error) {
      return HelperUtils.responseNotFound(error);
    }
  }

}

module.exports = UserDeviceController;
