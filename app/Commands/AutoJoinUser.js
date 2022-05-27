'use strict'

const { Command } = require('@adonisjs/ace');
const UserModel = use('App/Models/User');
const WhitelistUserModel = use('App/Models/WhitelistUser');
const HelperUtils = use('App/Common/HelperUtils');
const WhitelistService = use('App/Services/WhitelistUserService');
const CampaignModel = use('App/Models/Campaign');
const { exit } = require('process');

class AutoJoinUser extends Command {
  static get signature () {
    return 'auto:join:user {campaign: Campaign ID}'
  }

  static get description () {
    return 'Command to join user by Campaign Id'
  }

  async handle (args, options) {
    this.info('Dummy implementation for auto:join:user command');

    const whitelistService = new WhitelistService();
    const campaignId = args.campaign;
    console.log('Process Campaign:', campaignId);

    const campaign = await CampaignModel.query().where('id', campaignId).first();
    if (!campaign) {
      console.log('Campaign is not exist');
      process.exit(0);
      return false;
    }

    let users = await UserModel.query().fetch();
    users = JSON.parse(JSON.stringify(users));

    let countUser = 0;
    await Promise.all(users.map(async (user, index) => {
      console.log(JSON.stringify(user));
      const walletAddress = user.wallet_address;
      const filterParams = {
        'campaign_id': campaignId,
        'wallet_address': walletAddress,
      };

      // Check user joined
      let whitelist = await whitelistService.buildQueryBuilder(filterParams).first();
      whitelist = JSON.parse(JSON.stringify(whitelist));
      console.log('whitelist', whitelist);
      if (whitelist) {
        return;
      }

      const tier = (await HelperUtils.getUserTierSmart(walletAddress))[0];
      console.log('Wallet Address', walletAddress);
      console.log('Tier', tier);
      if (campaign.min_tier <= tier) {
        const newWhitelist = new WhitelistUserModel();
        newWhitelist.wallet_address = user.wallet_address;
        newWhitelist.campaign_id = campaign.id;
        newWhitelist.email = user.email;
        newWhitelist.save();
        console.log('Save user', JSON.stringify(newWhitelist));
        countUser++;
      }
    }));

    console.log('Total User Inserted: ', countUser);
    process.exit(0);
  }
}

module.exports = AutoJoinUser;
