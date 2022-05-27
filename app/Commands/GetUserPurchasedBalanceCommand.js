'use strict'

const { Command } = require('@adonisjs/ace');
const GetUserPurchasedBalanceJob = use('App/Jobs/GetUserPurchasedBalanceJob');
const CampaignModel = use('App/Models/Campaign');
const HelperUtils = use('App/Common/HelperUtils');
const { exit } = require('process');

class GetUserPurchasedBalanceCommand extends Command {
  static get signature () {
    return 'get-user-purchased-balance {campaign: Campaign ID}';
  }

  static get description () {
    return 'Get User Purchase Balance Job';
  }

  async handle (args, options) {
    this.info('Dummy implementation for auto:join:user command');

    const campaignId = args.campaign;
    console.log('Process Campaign:', campaignId);

    const campaign = await CampaignModel.query().where('id', campaignId).first();
    if (!campaign) {
      console.log('Campaign is not exist');
      process.exit(0);
      return false;
    }

    const res = await GetUserPurchasedBalanceJob.handle({
      campaign_id: campaignId,
    });
    console.log('Response :', res);
    process.exit(0);
  }
}

module.exports = GetUserPurchasedBalanceCommand;
