"use strict";

const HelperUtils = use('App/Common/HelperUtils');

class FormatEmailAndWallet {
  async handle({ request, params }, next) {
    const inputParams = request.all();
    // format email and wallet to lower case
    if (inputParams.email != undefined) {
      inputParams.email = inputParams.email.toLowerCase();
    }
    if (inputParams.wallet_address != undefined) {
      inputParams.wallet_address = HelperUtils.checkSumAddress(inputParams.wallet_address);
    }

    // Convert params
    if (params.email != undefined) {
      params.email = params.email.toLowerCase();
    }
    if (params.wallet_address != undefined) {
      params.wallet_address = HelperUtils.checkSumAddress(params.wallet_address);
    }
    if (params.walletAddress != undefined) {
      params.walletAddress = HelperUtils.checkSumAddress(params.walletAddress);
    }
    await next();
  }
}

module.exports = FormatEmailAndWallet;
