'use strict'

const { Command } = require('@adonisjs/ace');
const CampaignModel = use('App/Models/Campaign');
const SnapshotBalance = use('App/Jobs/SnapshotBalance');

const { exit } = require('process');

class SnapshotBalanceCommand extends Command {
  static get signature() {
    return 'snapshot:balance {campaign: Campaign ID}'
  }

  static get description() {
    return 'Snapshot Balance Command by Campaign Id. Usage: adonis snapshot:balance {campaignId}';
  }

  async handle(args, options) {
    this.info('Snapshot Balance Command Starting !!!');
    const campaign_id = args.campaign;
    this.info(`Data input: ${campaign_id}`);

    try {
      // get campaign
      const camp = await CampaignModel.query().where('id', campaign_id).first();
      if (!camp) {
        this.error(`ERROR !!!`);
        this.error(`Do not found campaign with id ${campaign_id}`);
        process.exit(0);
        return false;
      }
      // create data to snap shot
      const data = {
        campaign_id: campaign_id
      };

      // Run task SnapshotBalance
      await SnapshotBalance.doSnapshotBalance(data);
    } catch (e) {
      this.error('Snapshot Fail. Snapshot user balance has error!. Finishing...');
      this.error('ERROR: ', e);
      process.exit(0);
    }

    this.info('Snapshot Success. Snapshot user balance successful !. Finished !!!');
    process.exit(0);
  }
}

module.exports = SnapshotBalanceCommand;
