'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const UserBalanceSnapshotModel = use('App/Models/UserBalanceSnapshot');
const CampaignModel = use('App/Models/Campaign');
const WinnerListUserModel = use('App/Models/WinnerListUser');
const WhitelistService = use('App/Services/WhitelistUserService');
const UserBalanceSnapshotService = use('App/Services/UserBalanceSnapshotService');
const HelperUtils = use('App/Common/HelperUtils');
const priority = 'critical'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class PickRandomWinnerJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 5
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return Const.JOB_KEY.PICKUP_RANDOM_WINNER;
  }

  // This is where the work is done.
  static async handle(data) {
    console.log('PickRandomWinnerJob-job started', data);
    try {
      // do snapshot balance
      await PickRandomWinnerJob.doSnapshotBalance(data);
      // pickup random winner after snapshot all whitelist user balance
      await PickRandomWinnerJob.doPickupRandomWinner(data);
    } catch (e) {
      console.log('Pickup random winner has error', e);
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
        whitelist_completed: true,
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
          default:
            console.log('User has no quality tier to get lottery ticket');
        }
        let userSnapShot = new UserBalanceSnapshotModel();
        userSnapShot.fill({
          campaign_id: data.campaign_id,
          wallet_address: wallet,
          level: tier,
          lottery_ticket: tickets,
          pkf_balance: pkfBalance
        });
        userSnapshots.push(userSnapShot);
      }
      // save to user_balance_snapshot
      await campaignUpdated.userBalanceSnapshots().saveMany(userSnapshots);
      // increment page
      i++;
    } while (isLoopContinue)
  }

  static async doPickupRandomWinner(data) {
    // delete old winner
    const campaignUpdated = await CampaignModel.query().where('id', data.campaign_id).first();
    await campaignUpdated.winners().delete();
    for (let i = 0; i < data.tiers.length; i++) {
      const tier = data.tiers[i];
      const filters = {
        campaign_id: data.campaign_id,
        level: tier.level
      };
      // get all user by campaign and tier level to process
      const userSnapshotService = new UserBalanceSnapshotService();
      const userSnapshots = await userSnapshotService.getAllSnapshotByFilters(filters);
      const countObj = await userSnapshotService.countByFilters(filters);
      const count = countObj[0]['count(*)'];
      if (count && count == 0) {
        console.log(`Do not have any user belong to tier ${tier.level}`);
        continue;
      }
      let winners;
      switch (tier.level) {
        case 4:
          // calc lottery ticket for each user tier 4 Phoenix
          const totalPKFObj = await userSnapshotService.sumPKFBalanceByFilters(filters);
          const totalPKF = totalPKFObj[0]['sum(`pkf_balance`)'];
          winners = userSnapshots.toJSON().map(snapshot => {
            const winnerModel = new WinnerListUserModel();
            winnerModel.fill({
              wallet_address: snapshot.wallet_address,
              campaign_id: data.campaign_id,
              level: snapshot.level,
              lottery_ticket: tier.ticket_allow * snapshot.pkf_balance / totalPKF
            });
            return winnerModel;
          });
          break;
        case 3:
          // pickup random lottery ticket for  tier 3 Eagle
          if (tier.ticket_allow <= count) {
            // always allocate at least an ticket for each user who has tier 3
            winners = userSnapshots.toJSON().map((snapshot) => {
              const winnerModel = new WinnerListUserModel();
              winnerModel.fill({
                wallet_address: snapshot.wallet_address,
                campaign_id: data.campaign_id,
                level: snapshot.level,
                lottery_ticket: 1
              });
              return winnerModel;
            });
            break;
          }
          winners = await PickRandomWinnerJob.pickupRandom(userSnapshots.toJSON(), tier.ticket_allow - count, data.campaign_id, tier.level);
          break;
        default:
          // pickup random lottery ticket for these tiers 1,2 Dove Hawk
          winners = await PickRandomWinnerJob.pickupRandom(userSnapshots.toJSON(), tier.ticket_allow, data.campaign_id);
      }
      // save to winner list
      await campaignUpdated.winners().saveMany(winners);
    }
  }

  static async pickupRandom(userSnapshots, totalWinners, campaign_id, tier) {
    // map contain winner snapshot
    let winnerSnapshots = new Map();
    // convert to array to pick random lottery
    let userSnapshotArray = [];
    userSnapshots.map(snapshot => {
      let i = 1;
      while (i <= snapshot.lottery_ticket) {
        userSnapshotArray.push(snapshot);
        i++;
      }
      // always push at least one ticket winner for user tier 3
      if (tier == 3) {
        snapshot.winner_ticket++;
        winnerSnapshots.set(snapshot.wallet_address, snapshot);
      }
    });


    // pick up random winner
    let i = 1;
    // loop with max total ticket winner which allocate for each tier
    while (i <= totalWinners) {
      const winner = userSnapshotArray[Math.floor(Math.random() * userSnapshotArray.length)];
      // check existed
      if (winnerSnapshots.has(winner.wallet_address)) {
        const existed = winnerSnapshots.get(winner.wallet_address);
        // increment winner ticket
        existed.winner_ticket = existed.winner_ticket + 1;
        winnerSnapshots.set(winner.wallet_address, existed);
      } else {
        winner.winner_ticket++;
        winnerSnapshots.set(winner.wallet_address, winner);
      }
      i++;
    }

    // create winner model list
    const winnerModelList = [];
    winnerSnapshots.forEach((snapshot) => {
      const winnerModel = new WinnerListUserModel();
      winnerModel.fill({
        wallet_address: snapshot.wallet_address,
        campaign_id: campaign_id,
        level: snapshot.level,
        lottery_ticket: snapshot.winner_ticket
      });
      winnerModelList.push(winnerModel);
    });

    return winnerModelList;
  }

  // Dispatch
  static doDispatch(data) {
    console.log('Dispatch pickup random winner with data : ', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = PickRandomWinnerJob

