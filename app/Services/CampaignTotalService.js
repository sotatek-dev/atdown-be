'use strict'

const CampaignTotalModel = use('App/Models/CampaignTotal');
const CampaignModel = use('App/Models/Campaign');
const Config = use('Config')
const BigNumber = use('bignumber.js');

class CampaignTotalService
{
    async updateTotal(campaign_id, decimals, param) {
      const campaignFound = await CampaignTotalModel.query().where('campaign_id', campaign_id).first();
      const amount = new BigNumber(param.params.amount).dividedBy(Math.pow(10, decimals)).toFixed();
      if (!campaignFound) {
        const campaignTotal = new CampaignTotalModel();
        campaignTotal.campaign_id = campaign_id;
        if (param.event == Config.get('const.event_by_token')) {
          campaignTotal.token = amount;
        } else {
          campaignTotal.eth = amount;
        }
        campaignTotal.save();
      } else {
        if(param.event == Config.get('const.event_by_token')) {
          await CampaignTotalModel.query().where('campaign_id', campaign_id)
            .update({
              token: new BigNumber(campaignFound.token || 0).plus(amount).toFixed()
            });
        } else {
          await CampaignTotalModel.query().where('campaign_id', campaign_id)
            .update({
              eth: new BigNumber(campaignFound.eth || 0).plus(amount).toFixed()
            });
        }
      }
      return true;
    }
}

module.exports = CampaignTotalService;
