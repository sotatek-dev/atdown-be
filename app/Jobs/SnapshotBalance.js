'use strict'

const UserBalanceSnapshotPreModel = use('App/Models/UserBalanceSnapshotPre');
const CampaignModel = use('App/Models/Campaign');
const WhitelistService = use('App/Services/WhitelistUserService');
const HelperUtils = use('App/Common/HelperUtils');

class SnapshotBalance {
  // This is where the work is done.
  static async handle(data) {
    console.log('SnapshotBalance-job started', data);
    try {
      // do snapshot balance
      await SnapshotBalance.doSnapshotBalance(data);
    } catch (e) {
      console.log('SnapshotBalance has error', e);
      throw e;
    }
  }

  static async doSnapshotBalance(data) {
    // delete all old snapshot
    const campaignUpdated = await CampaignModel.query().where('id', data.campaign_id).first();
    await campaignUpdated.userBalanceSnapshots().delete();
    // get list whitelist to snapshot balance
    let i = 1;
    let whitelist;
    let isLoopContinue = false;
    do {
      // loop each 10 records to process
      const filterParams = {
        campaign_id: data.campaign_id,
        page: i,
        pageSize: 10
      }
      const whitelistService = new WhitelistService();
      whitelist = await whitelistService.findWhitelistUser(filterParams);
      // loop to get balance of each user on white list
      const whitelistObj = whitelist.toJSON();
      if (whitelistObj.total > 10 * i) {
        isLoopContinue = true;
      } else {
        isLoopContinue = false;
      }
      let userSnapshots = [];
      for (let i = 0; i < whitelistObj.data.length; i++) {
        // get user PKF balance and tier from SC
        const wallet = whitelistObj.data[i].wallet_address;
        const receivedData = await HelperUtils.getUserTierSmart(wallet);
        const tier = receivedData[0];
        const pkfBalance = receivedData[1];
        // mock test
        // const tier = Math.floor(Math.random() * 5);
        // const tier = 3;
        // const pkfBalance = Math.floor(Math.random() * (10000 - 500) + 500);
        console.log(`Snapshot user balance with wallet ${wallet} tier ${tier} pkf_balance ${pkfBalance}`);
        // calc lottery_tickets
        // TODO need get setting from Db
        let tickets = 0;
        switch (tier) {
          case 1:
            tickets = Math.floor(pkfBalance / 500);
            break;
          case 2:
            tickets = Math.floor(pkfBalance / 500);
            break;
          case 3:
            tickets = Math.floor(pkfBalance / 2000);
            break;
          case 4:
            tickets = Math.floor(pkfBalance / 2000);
            break;
          default :
            console.log('User has no quality tier to get lottery ticket');
        }
        let userSnapShotPre = new UserBalanceSnapshotPreModel();
        userSnapShotPre.fill({
          campaign_id: data.campaign_id,
          wallet_address: wallet,
          level: tier,
          lottery_ticket: tickets,
          pkf_balance: pkfBalance
        });
        userSnapshots.push(userSnapShotPre);
      }
      // save to user_balance_snapshot_pre
      await campaignUpdated.userBalanceSnapshotsPre().saveMany(userSnapshots);
      // increment page
      i++;
    } while (isLoopContinue)
  }
}

module.exports = SnapshotBalance

