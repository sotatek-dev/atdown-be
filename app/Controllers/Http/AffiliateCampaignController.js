'use strict'

const AffiliateCampaignModel = use('App/Models/AffiliateCampaign');
const AssetTokenService = use('App/Services/AssetTokenService');
const CampaignModel = use('App/Models/Campaign');
const newToken = new AssetTokenService();
const Const = use('App/Common/Const');
const CONFIGS_FOLDER = '../../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGN];
const { abi: CONTRACT_ABI } = CONTRACT_CONFIGS.CONTRACT_DATA;
const Web3 = require('web3');
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
const HelperUtils = use('App/Common/HelperUtils');

class AffiliateCampaignController {
  async affiliateCreate({request}) {
    try {
      const param = request.all();
      const contractBlock = await web3.eth.getTransaction(param.txHash);
      if (!contractBlock) {
        return HelperUtils.responseBadRequest('Affiliate not found')
      }
      const campaign = await CampaignModel.query().where('token', '=', param.params.tokenAddress).firstOrFail();
      let affiliateCampaign = new AffiliateCampaignModel();
      affiliateCampaign.campaign_creator = param.params.campaignCreator;
      affiliateCampaign.name = param.params.name;
      affiliateCampaign.token_address = param.params.tokenAddress;
      affiliateCampaign.commission = param.params.commission;
      affiliateCampaign.campaign_id = campaign.id;
      affiliateCampaign.campaign_index = param.params.campaignId;
      await affiliateCampaign.save()
      return {
        status: 200,
        data: affiliateCampaign,
      }
    } catch (e) {
      console.log('ERROR', e);
      return HelperUtils.responseErrorInternal('Error')
    }
  }

  async affiliateList({request}) {
    try {
      const token = request.params.token
      const dataList = await AffiliateCampaignModel.query().where('token_address', '=', token).fetch();
      return HelperUtils.responseSuccess(dataList);
    } catch (e) {
      console.log('ERROR', e);
      return HelperUtils.responseErrorInternal('Error')
    }
  }
}

module.exports = AffiliateCampaignController
