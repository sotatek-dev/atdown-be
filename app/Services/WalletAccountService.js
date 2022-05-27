'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const WalletAccountModel = use('App/Models/WalletAccount');

const Web3 = require('web3');
const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);

class WalletAccountService {
  buildQueryBuilder(params) {
    let builder = WalletAccountModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', params.wallet_address);
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }
    return builder;
  }

  async createWalletByWeb3() {
    const account = await web3.eth.accounts.create(web3.utils.randomHex(32));
    return account;
  }

  async createWalletAddress(campaignId) {
    // Create Web3 Account
    const account = await this.createWalletByWeb3();
    const wallet = new WalletAccountModel();
    wallet.wallet_address = account.address;
    wallet.private_key = account.privateKey;
    wallet.campaign_id = campaignId;
    await wallet.save();

    return wallet;
  }

  async findByCampaignId(params) {
    let builder = this.buildQueryBuilder(params);
    return await builder.first();
  }
}

module.exports = WalletAccountService;
