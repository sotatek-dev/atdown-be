'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const UserBalanceSnapshotModel = use('App/Models/UserBalanceSnapshot');
const CampaignModel = use('App/Models/Campaign');
const TierModel = use('App/Models/Tier');
const WinnerListUserModel = use('App/Models/WinnerListUser');
const WhitelistService = use('App/Services/WhitelistUserService');
const UserBalanceSnapshotService = use('App/Services/UserBalanceSnapshotService');
const HelperUtils = use('App/Common/HelperUtils');
const BigNumber = use('bignumber.js');

const priority = 'critical'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class PickLuckyDoveHawkAndWeightEaglePhoenix {
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
    console.log('PickLuckyDoveHawkAndWeightEaglePhoenix-job started', data);
    try {
      // do snapshot balance
      await this.doSnapshotBalance(data);
      // pickup random winner after snapshot all whitelist user balance
      await this.doPickupWinner(data);
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
        const pkfBalanceSmartContract = receivedData[1];
        let pkfBalance = pkfBalanceSmartContract;
        switch (tier) {
          case 1: // Dove
            break;
          case 2: // Hawk
            break;
          case 3: // Eagle
            break;
          case 4: // Phoenix
            pkfBalance = new BigNumber(pkfBalance).multipliedBy(1.05).toFixed();
            break;
          default:
            break;
        }

        // TODO need get setting from Db
        let tickets = 0;
        switch (tier) {
          case 1: // Dove
            tickets = Math.floor(pkfBalance / 500);
            break;
          case 2: // Hawk
            tickets = Math.floor(pkfBalance / 5000);
            break;
          case 3: // Eagle
            tickets = Math.floor(pkfBalance / 2000);
            break;
          case 4: // Phoenix
            tickets = Math.floor(pkfBalance / 2000);
            break;
          default:
        }
        let userSnapShot = new UserBalanceSnapshotModel();
        userSnapShot.fill({
          campaign_id: data.campaign_id,
          wallet_address: wallet,
          level: tier,
          lottery_ticket: tickets,
          pkf_balance: pkfBalanceSmartContract,
          pkf_balance_with_weight_rate: pkfBalance,
        });
        userSnapshots.push(userSnapShot);
      }
      // save to user_balance_snapshot
      await campaignUpdated.userBalanceSnapshots().saveMany(userSnapshots);
      // increment page
      i++;
    } while (isLoopContinue)
  }

  static async doPickupWinner(data) {
    // delete old winner
    const campaignUpdated = await CampaignModel.query().where('id', data.campaign_id).first();
    await campaignUpdated.winners().delete();
    let tierList = await TierModel.query().where('campaign_id', data.campaign_id).fetch();
    tierList = JSON.parse(JSON.stringify(tierList));

    const userSnapshotService = new UserBalanceSnapshotService();
    const totalPKFObj = await userSnapshotService.sumPKFWithLevels({
      campaign_id: data.campaign_id,
      levels: [3, 4], // Eagle vs Phoenix
    });
    const totalPKF = totalPKFObj[0]['sum(`pkf_balance_with_weight_rate`)'];

    for (let i = 0; i < data.tiers.length; i++) {
      const tier = data.tiers[i];
      const filters = {
        campaign_id: data.campaign_id,
        level: tier.level
      };
      // get all user by campaign and tier level to process
      const userSnapshots = await userSnapshotService.getAllSnapshotByFilters(filters);
      const countObj = await userSnapshotService.countByFilters(filters);
      const count = countObj[0]['count(*)'];
      if (count && count === 0) {
        console.log(`Do not have any user belong to tier ${tier.level}`);
        continue;
      }
      let winners = [];
      switch (tier.level) {
        case 1:
        case 2:
          winners = await this.pickupRandom(userSnapshots.toJSON(), tier.ticket_allow, data.campaign_id);
          break
        case 3:
        case 4:
          const tiers = tierList;
          winners = userSnapshots.toJSON().map(snapshot => {
            const winnerModel = new WinnerListUserModel();
            const tickets = this.calculateAllocationByTier(snapshot, tier, tiers, totalPKF);
            winnerModel.fill({
              wallet_address: snapshot.wallet_address,
              campaign_id: data.campaign_id,
              level: snapshot.level,
              lottery_ticket: tickets,
            });
            return winnerModel;
          })
          break
        default:
      }
      // save to winner list
      await campaignUpdated.winners().saveMany(winners);
    }
  }

  static calculateAllocationByTier(snapshot, tierObj, tiers, totalPKF) {
    const totalPKFAllocate = (this.sumTotalAllowcatePkf(tiers)) || 0;
    let userPkfBalance = snapshot.pkf_balance || 0;
    const userTier = snapshot.level || 0;
    switch (userTier) {
      case 1: // Dove
        break;
      case 2: // Hawk
        break;
      case 3: // Eagle
        break;
      case 4: // Phoenix
        userPkfBalance = new BigNumber(userPkfBalance).multipliedBy(1.05).toFixed();
        break;
      default:
        break;
    }

    if (new BigNumber(totalPKF || 0).lte(0)) {
      return 0;
    }
    // userPkfBalance * totalPKFWithWeightBalance / totalPKF;
    const tickets = new BigNumber(userPkfBalance)
      .multipliedBy(totalPKFAllocate)
      .div(totalPKF)
      .div(tierObj.max_buy) // Price per 1 ticket
      .toFixed();

    return tickets || 0;
  }

  static sumTotalAllowcatePkf(tiers) {
    let sumTotal = 0;
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (tier.level === 3 ||   // Eagle
        tier.level === 4      // Phoenix
      ) {
        sumTotal = new BigNumber(sumTotal).plus(
          new BigNumber(tier.ticket_allow || 0).multipliedBy(tier.max_buy || 0)
        );
      }
    }
    return (new BigNumber(sumTotal)).toFixed();
  }

  static async pickupRandom(userSnapshots, totalWinners, campaign_id, tier) {
    // convert to array to pick random lottery
    let userSnapshotArray = [];
    userSnapshots.map(snapshot => {
      let i = 1;
      while (i <= snapshot.lottery_ticket) {
        userSnapshotArray.push(snapshot);
        i++;
      }
    });

    // pick up random winner
    // create a map contain winner snapshot
    let winnerSnapshots = new Map();
    let i = 1;
    // loop with max total ticket winner which allocate for each tier
    while (i <= totalWinners && userSnapshotArray.length > 0) {
      // get random index
      const ran_index = Math.floor(Math.random() * userSnapshotArray.length);
      const winner = userSnapshotArray[ran_index];
      // check existed
      if (winnerSnapshots.has(winner.wallet_address)) {
        const existed = winnerSnapshots.get(winner.wallet_address);
        if (existed.winner_ticket < 2) {
          // max 2 win ticket for each user
          // increment winner ticket
          existed.winner_ticket = existed.winner_ticket + 1;
          winnerSnapshots.set(winner.wallet_address, existed);
          i++;
        } else {
          // remove existed on userSnapshotArray
          userSnapshotArray.splice(ran_index, 1);
          // do not increment i
        }
      } else {
        winner.winner_ticket++;
        winnerSnapshots.set(winner.wallet_address, winner);
        i++;
      }
    }

    // create winner model list
    const winnerModelList = [];
    winnerSnapshots.forEach((snapshot) => {
      console.log(`Winner user with wallet ${snapshot.wallet_address} tier ${snapshot.level} ticket win ${snapshot.winner_ticket}`);
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

module.exports = PickLuckyDoveHawkAndWeightEaglePhoenix

