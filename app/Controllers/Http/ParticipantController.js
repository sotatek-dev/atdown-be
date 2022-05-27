'use strict'

const CampaignModel = use('App/Models/Campaign');
const WhitelistUser = use('App/Models/WhitelistUser');
const WinnerListUser = use('App/Models/WinnerListUser');
const CampaignService = use('App/Services/CampaignService');
const Const = use('App/Common/Const');
const Common = use('App/Common/Common');
const HelperUtils = use('App/Common/HelperUtils');

const CONFIGS_FOLDER = '../../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGN];
const CONTRACT_FACTORY_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGNFACTORY];

const { abi: CONTRACT_ABI } = CONTRACT_CONFIGS.CONTRACT_DATA;
const { abi: CONTRACT_FACTORY_ABI } = CONTRACT_FACTORY_CONFIGS.CONTRACT_DATA;
const { abi: CONTRACT_ERC20_ABI } = require('../../../blockchain_configs/contracts/Normal/Erc20.json');

const Web3 = require('web3');
const BadRequestException = require("../../Exceptions/BadRequestException");
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
const Config = use('Config')
const ErrorFactory = use('App/Common/ErrorFactory');

class ParticipantController {

  // async getParticipantUsers({ request, params }) {
  //   const users = await WhitelistUser.query()
  //     .where('campaign_id', params.campaign_id)
  //     .fetch();
  //
  //   return {
  //     status: 200,
  //     data: users,
  //   }
  // }
  //
  // async getWinnerUsers({ request, params }) {
  //   const users = await WinnerListUser.query()
  //     .where('campaign_id', params.campaign_id)
  //     .fetch();
  //
  //   return {
  //     status: 200,
  //     data: users,
  //   }
  // }
}

module.exports = ParticipantController
