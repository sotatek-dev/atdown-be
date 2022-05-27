'use strict'

const AssetTokenModel = use('App/Models/AssetToken');
const ErrorFactory = use('App/Common/ErrorFactory');
const CampaignModel = use('App/Models/Campaign');

class AssetTokenService
{
    async checkTokenIsset(token, wallet_address) {
      const assetToken = await AssetTokenModel.query().where('token_address', '=', token).where('wallet_address', '=', wallet_address).first();
      if (assetToken) {
        return true
      }
      else return false
    }
    async createAsset(token, wallet_address, symbol){
      const check = await this.checkTokenIsset(token, wallet_address)
      if(check){
        return true;
      }else {
        const asset = new AssetTokenModel()
        asset.symbol_name = symbol;
        asset.token_address = token;
        asset.wallet_address = wallet_address;
        await asset.save()
        return true;
      }
    }

}

module.exports = AssetTokenService;
