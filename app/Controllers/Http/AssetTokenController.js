'use strict'

const AssetTokenModel = use('App/Models/AssetToken');
const AssetTokenService = use('App/Services/AssetTokenService');
const newToken = new AssetTokenService();
const HelperUtils = use('App/Common/HelperUtils');

class CampaignController {
  async create({request}) {
    try {
      const param = request.all();
      if (await newToken.checkTokenIsset(param.token, param.wallet_address)) {
        return HelperUtils.responseBadRequest('Address token already exists!');
      }
      let createAsset = new AssetTokenModel();
      createAsset.token_address = param.token;
      createAsset.symbol_name = param.symbol_name;
      createAsset.wallet_address = param.wallet_address;
      await createAsset.save();
      return HelperUtils.responseSuccess(createAsset);
    } catch (e) {
      console.log(e)
      return HelperUtils.responseBadRequest('ERROR: create asset fail !')
    }
  }

  async list({request}) {
    try {
      const contract = request.params.contract;
      const listdata = await AssetTokenModel.query().where('wallet_address', '=', contract).fetch();
      return HelperUtils.responseSuccess(listdata);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR : list asset fail !');
    }
  }

  async remove({request, auth}) {
    try {
      const walletAddress = auth.user.wallet_address
      const tokenAddress = request.params.id
      const findWallet = await AssetTokenModel.query()
        .where('wallet_address', walletAddress)
        .where('id', tokenAddress).delete()
      if (findWallet) {
        return HelperUtils.responseSuccess()
      } else
        return HelperUtils.responseBadRequest()
    } catch (e) {
      console.error(e)
      return HelperUtils.responseErrorInternal('ERROR: remove asset fail !')
    }
  }
}

module.exports = CampaignController
