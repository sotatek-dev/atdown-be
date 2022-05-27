'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const Mail = use('Mail');
const Env = use('Env')
const WinnerListService = use('App/Services/WinnerListUserService');
const HelperUtils = use('App/Common/HelperUtils');
const CampaignModel = use('App/Models/Campaign');
const UserPurchasedBalanceModel = use('App/Models/UserPurchasedBalance');
const BigNumber = use('bignumber.js')
BigNumber.config({EXPONENTIAL_AT: 50});

const priority = 'critical'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class GetUserPurchasedBalanceJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return Const.JOB_KEY.GET_USER_PURCHASED_BALANCE;
  }

  // This is where the work is done.
  static async handle (data) {
    console.log('GetUserPurchasedBalance-job started', data);

    const { campaign_id, wallet_address } = data;
    // get campaign
    let camp = await CampaignModel.query().where('id', campaign_id).first();
    if (!camp) {
      console.log(`Campaign Not Found: ${campaign_id}`);
      return HelperUtils.responseBadRequest('Campaign Not Found');
    }
    camp = JSON.parse(JSON.stringify(camp));

    // get winner list
    const filterParams = {
      'campaign_id': campaign_id,
      'page': 1,
      'pageSize': 1000000000000000000000,
    };
    const winnerListService = new WinnerListService();
    let winners = await winnerListService.buildQueryBuilder(filterParams).fetch();
    if (winners) {
      winners = JSON.parse(JSON.stringify(winners));
    }
    const contract = await HelperUtils.getContractInstance(camp);

    // Insert record
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const winnerWallet = winner.wallet_address;
      console.log('winner.wallet_address', winnerWallet);

      let userPurchasedAmount = await contract.methods.userPurchased(winnerWallet).call();
      userPurchasedAmount = new BigNumber(userPurchasedAmount).div(Math.pow(10, camp.decimals || 0)).toFixed();

      console.log('userPurchasedAmount: ', userPurchasedAmount);

      // Find and update
      const userPurcha = await UserPurchasedBalanceModel.query()
        .where('wallet_address', winnerWallet)
        .where('campaign_id', campaign_id)
        .first();

      console.log('userPurcha', userPurcha);
      if (userPurcha) {
        console.log('Update User Purchase: ');
        // Update User purchase
        const res = await UserPurchasedBalanceModel.query()
          .where('wallet_address', winnerWallet)
          .where('campaign_id', campaign_id)
          .update({
            user_purchased_amount: userPurchasedAmount,
          });
      } else {
        console.log('Create User Purchase: ');
        // Create User purchase
        const res = await UserPurchasedBalanceModel.create({
          campaign_id,
          wallet_address: winnerWallet,
          user_purchased_amount: userPurchasedAmount,
        });
      }
    }
    return 1;
  }

  // Dispatch
  static doDispatch(data) {
    console.log('Dispatch GetUserPurchasedBalanceJob: ', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = GetUserPurchasedBalanceJob;

