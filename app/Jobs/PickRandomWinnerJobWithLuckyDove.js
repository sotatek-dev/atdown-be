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

class PickRandomWinnerJobWithLuckyDove {
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
    console.log('PickRandomWinnerJobWithLuckyDove-job started', data);
    try {
      // do snapshot balance
      await PickRandomWinnerJobWithLuckyDove.doSnapshotBalance(data);
      // pickup random winner after snapshot all whitelist user balance
      await PickRandomWinnerJobWithLuckyDove.doPickupRandomWinner(data);
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

      console.log('Start with filterParams:========>', filterParams);
      const whitelistService = new WhitelistService();
      whitelist = await whitelistService.findWhitelistUser(filterParams);
      console.log('Whitelist', JSON.stringify(whitelist));
      // loop to get balance of each user on white list
      const whitelistObj = whitelist.toJSON();
      if (whitelistObj.total > 10 * i) {
        isLoopContinue = true;
      } else {
        isLoopContinue = false;
      }
      console.log('whitelistObj.total:', whitelistObj.total);
      let userSnapshots = [];
      for (let i = 0; i < whitelistObj.data.length; i++) {
        // get user PKF balance and tier from SC
        const wallet = whitelistObj.data[i].wallet_address;
        const receivedData = await HelperUtils.getUserTierSmart(wallet);
        console.log('getUserTierSmart: ', receivedData);
        const tier = receivedData[0];
        const pkfBalanceSmartContract = receivedData[1];
        let pkfBalance = pkfBalanceSmartContract;
        switch (tier) {
          case 1: // Dove
            break;
          case 2: // Hawk
            break;
          case 3: // Eagle
            pkfBalance = new BigNumber(pkfBalance).multipliedBy(1.05).toFixed();
            break;
          case 4: // Phoenix
            pkfBalance = new BigNumber(pkfBalance).multipliedBy(1.1).toFixed();
            break;
          default:
            break;
        }

        // mock test
        // const tier = Math.floor(Math.random() * 5);
        // const tier = 3;
        // const pkfBalance = Math.floor(Math.random() * (10000 - 500) + 500);
        console.log(`Snapshot user balance with wallet ${wallet} tier ${tier} pkf_balance ${pkfBalance}`);
        // calc lottery_tickets
        // TODO need get setting from Db
        let luckyLevel = 0;
        let tickets = 0;
        switch (tier) {
          case 1: // Dove
            console.log('DOVE:');
            luckyLevel = await PickRandomWinnerJobWithLuckyDove.getLuckyDoveLevel(data.campaign_id, wallet);
            console.log('luckyLevel:', luckyLevel);

            if (luckyLevel) {
              console.log('Origin pkfBalance:', pkfBalance);
              if (luckyLevel == 1) {
                console.log('new BigNumber(pkfBalance).mul(2).toNumber():', new BigNumber(+pkfBalance).multipliedBy(2).toNumber());
                tickets = Math.floor(
                  new BigNumber(+pkfBalance).multipliedBy(2).toNumber() // Bonus Lucky x2
                  / 500
                );
              } else if (luckyLevel >= 2) { // Fail >= 2 times --> Bonus x3
                console.log('new BigNumber(pkfBalance).mul(3).toNumber():', new BigNumber(+pkfBalance).multipliedBy(3).toNumber());
                tickets = Math.floor(
                  new BigNumber(+pkfBalance).multipliedBy(3).toNumber() // Bonus Lucky x3
                  / 500
                );
              }
            } else {
              tickets = Math.floor(pkfBalance / 500);
            }
            console.log('tickets', tickets);

            break;
          case 2: // Hawk
            tickets = Math.floor(pkfBalance / 500);
            break;
          case 3: // Eagle
            tickets = Math.floor(pkfBalance / 2000);
            break;
          case 4: // Phoenix
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
          pkf_balance: pkfBalanceSmartContract,
          pkf_balance_with_weight_rate: pkfBalance,
        });
        if (luckyLevel) {
          userSnapShot.lucky_level = luckyLevel;
        }
        userSnapshots.push(userSnapShot);
      }
      // save to user_balance_snapshot
      await campaignUpdated.userBalanceSnapshots().saveMany(userSnapshots);
      // increment page
      i++;
    } while (isLoopContinue)
  }

  static async findLastIDOCampaigns(currentCampaignId, walletAddress) {
    const now = Math.floor(new Date().getTime() / 1000);
    // Find last IDO
    // Sample SQL:
    // select * from `campaigns` where `id` != ? and `pick_winner_rule` != ? and `end_join_pool_time` < ? and exists (select * from `whitelist_users` where `wallet_address` = ? and `campaigns`.`id` = `whitelist_users`.`campaign_id`) order by `end_join_pool_time` DESC limit ?; bindings: [28,,1624017581,0x69a21E10FEBdA6d0904547Da24a2a6d905cc83a3,4]
    const campaign = await CampaignModel.query()
      .where('id', '!=', currentCampaignId)
      .where('pick_winner_rule', '!=', '')  // Only check with pool picked winner
      .where('end_join_pool_time', '<', now)  // pool must is end whitelist
      .whereHas('whitelistUsers', (builder) => {  // user must join whitelist
        builder.where('wallet_address', walletAddress);
      })
      .orderBy('end_join_pool_time', 'DESC')
      .limit(4)
      .fetch();
    return campaign;
  }

  static async getLuckyDoveLevel(currentCampaignId, walletAddress) {
    // Find last IDO Campaign User Whitelist
    let joinedBeforeCampaigns = await PickRandomWinnerJobWithLuckyDove.findLastIDOCampaigns(currentCampaignId, walletAddress);
    joinedBeforeCampaigns = JSON.parse(JSON.stringify(joinedBeforeCampaigns));
    console.log('[getLuckyDoveLevel] - joinedBeforeCampaigns', JSON.stringify(joinedBeforeCampaigns));

    if (!joinedBeforeCampaigns) {
      return 0;  // Not is Lucky
    }
    const countCampaign = joinedBeforeCampaigns.length;
    if (countCampaign == 0) {
      return 0;  // Not is Lucky
    }

    console.log('countCampaign', countCampaign);
    console.log('Begin Check Lucky Dove:==========>');
    // Check and convert campaign to level (Break if match)
    // Pool 1: x2
    // Pool 2: x3
    // Pool 3: x3
    let luckyLevel = 0;
    for (let i = 0; i < countCampaign; i++) {
      const campaign = joinedBeforeCampaigns[i];
      console.log('Check campaign', campaign);
      const isLucky = await PickRandomWinnerJobWithLuckyDove.checkIsLuckyDove(campaign, walletAddress, i);
      if (isLucky) {
        luckyLevel = (i + 1);
        break;
      }
    }

    return luckyLevel;
  }

  static async checkIsLuckyDove(campaign, walletAddress, campaignIndex) {
    // Check user is winner in last IDO Campaign
    const isWinner = await WinnerListUserModel.query()
      .where('campaign_id', campaign.id)
      .where('wallet_address', walletAddress)
      .first();
    console.log('campaignIndex:', campaignIndex);
    console.log('campaign.id:', campaign.id);
    console.log('isWinner:', isWinner);

    return !isWinner;
  }


  static async doPickupRandomWinner(data) {
    // delete old winner
    const campaignUpdated = await CampaignModel.query().where('id', data.campaign_id).first();
    await campaignUpdated.winners().delete();
    let tierList = await TierModel.query().where('campaign_id', data.campaign_id).fetch();
    tierList = JSON.parse(JSON.stringify(tierList));

    const userSnapshotService = new UserBalanceSnapshotService();
    const totalPKFObj = await userSnapshotService.sumPKFWithWeightRateBalance({
      campaign_id: data.campaign_id,
    });
    const totalPKF = totalPKFObj[0]['sum(`pkf_balance_with_weight_rate`)'];

    console.log('totalPKFtotalPKFtotalPKF============================>', totalPKF);

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
      if (count && count == 0) {
        console.log(`Do not have any user belong to tier ${tier.level}`);
        continue;
      }
      let winners;

      if (tier.level == 0) {
        // Nothing to do
      } else if (tier.level == 1) {
        // pickup random lottery ticket for these tiers 1 Dove
        winners = await PickRandomWinnerJobWithLuckyDove.pickupRandom(userSnapshots.toJSON(), tier.ticket_allow, data.campaign_id);
      } else {
        // pickup random lottery ticket for  tier 2,3,4 Hawk Eagle Phoenix
        // case ticket_allow > no of users
        // calc lottery ticket for each user base on amount sPKF
        const tiers = tierList;
        console.log('data.tiers', tiers);
        winners = userSnapshots.toJSON().map(snapshot => {
          const winnerModel = new WinnerListUserModel();
          const tickets = this.caculateAllowcationByTier(snapshot, tier, tiers, totalPKF);
          console.log('WINNER:', snapshot, tickets);
          winnerModel.fill({
            wallet_address: snapshot.wallet_address,
            campaign_id: data.campaign_id,
            level: snapshot.level,
            lottery_ticket: tickets,
          });
          return winnerModel;
        });
      }
      console.log('END doPickupRandomWinner: winners:', JSON.stringify(winners));
      // save to winner list
      await campaignUpdated.winners().saveMany(winners);
    }
  }

  static caculateAllowcationByTier(snapshot, tierObj, tiers, totalPKF) {
    // userPkfBalance  // (1)
    // 1.05  // (2)
    // totalPKFWithWeightBalance // (3)
    // totakPkf // (4) // raw total pkf of all user

    const totalPKFAllocate = (this.sumTotalAllowcatePkf(tiers)) || 0;
    let userPkfBalance = snapshot.pkf_balance || 0;
    const userTier = snapshot.level || 0;
    switch (userTier) {
      case 1: // Dove
        break;
      case 2: // Hawk
        break;
      case 3: // Eagle
        userPkfBalance = new BigNumber(userPkfBalance).multipliedBy(1.05).toFixed();
        break;
      case 4: // Phoenix
        userPkfBalance = new BigNumber(userPkfBalance).multipliedBy(1.1).toFixed();
        break;
      default:
        break;
    }

    if (new BigNumber(totalPKF || 0).lte(0)) {
      return 0;
    }
    console.log('tierObj: ==========>', tierObj);
    // userPkfBalance * totalPKFWithWeightBalance / totalPKF;
    const tickets = new BigNumber(userPkfBalance)
      .multipliedBy(totalPKFAllocate)
      .div(totalPKF)
      .div(tierObj.max_buy) // Price per 1 ticket
      .toFixed();

    console.log('SUM Result:', userPkfBalance, totalPKFAllocate, totalPKF);
    console.log('TICKET: ', tickets);
    return tickets || 0;
  }

  static sumTotalAllowcatePkf(tiers) {
    let sumTotal = 0;
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (tier.level === 2 ||   // Hawk
        tier.level === 3 ||   // Eagle
        tier.level === 4      // Phoenix
      ) {
        sumTotal = new BigNumber(sumTotal).plus(
          new BigNumber(tier.ticket_allow || 0).multipliedBy(tier.max_buy || 0)
        );
      }
    }
    console.log('sumTotalAllowcatePkf', (new BigNumber(sumTotal)).toFixed());
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

module.exports = PickRandomWinnerJobWithLuckyDove

