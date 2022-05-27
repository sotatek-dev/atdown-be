'use strict'

const AffiliateCampaignModel = use('App/Models/AffiliateCampaign');

class AffiliateCampaignService
{
    async checkTokenIsset(token) {
      const assetToken = await AffiliateCampaignModel.query().where('token_address', '=', token).first();
      if (assetToken) {
        return true
      }
      else return false
    }
}

module.exports = AffiliateCampaignService;
