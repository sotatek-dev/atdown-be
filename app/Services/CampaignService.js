'use strict'

const CampaignModel = use('App/Models/Campaign');
const WhitelistModel = use('App/Models/WhitelistUser');
const WinnerListModel = use('App/Models/WinnerListUser');
const WhitelistSubmissionModel = use('App/Models/WhitelistSubmission')
const ReservedListModel = use('App/Models/ReservedList');

const CanceledApplyWhitelist = use('App/Models/CanceledApplyWhitelist');
const FcfsRoundModel= use('App/Models/FcfsRoundSetting');
const TierModel = use('App/Models/Tier');

const Config = use('Config');
const Const = use('App/Common/Const');
const ErrorFactory = use('App/Common/ErrorFactory');
const BigNumber = use('bignumber.js');
const CheckTxStatus = use('App/Jobs/CheckTxStatus');
const Redis = use('Redis');

const WinnerListService = use('App/Services/WinnerListUserService');
const ReservedListService =use('App/Services/ReservedListService');
const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGN];
const CONTRACT_FACTORY_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGNFACTORY];

const ConvertDateUtils = use('App/Common/ConvertDateUtils');
const HelperUtils = use('App/Common/HelperUtils');

const Web3 = require('web3');
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
const { abi: CONTRACT_ABI } = CONTRACT_CONFIGS.CONTRACT_DATA;
const { abi: CONTRACT_FACTORY_ABI } = CONTRACT_FACTORY_CONFIGS.CONTRACT_DATA;

class CampaignService {
  async createCampaign(param, receipt, receiptData) {
    const campaign = new CampaignModel();
    campaign.campaign_id = param.params.poolId;
    campaign.registed_by = param.params.registedBy;
    campaign.campaign_hash = param.params.pool;
    campaign.token = param.params.token;
    campaign.title = receipt[2]
    campaign.start_time = receipt[0];
    campaign.finish_time = receipt[1];
    campaign.token_conversion_rate = receipt[3];
    campaign.ether_conversion_rate = new BigNumber(receipt[4]).dividedBy(Math.pow(10, receipt[5])).toFixed();
    campaign.name = receiptData[0];
    campaign.decimals = receiptData[1];
    campaign.symbol = receiptData[2];
    campaign.affiliate = false;
    campaign.funding_wallet_address = receipt[6];
    campaign.is_pause = receipt[7];
    campaign.transaction_hash = param.txHash;
    campaign.is_deploy = true;
    await campaign.save();
    return campaign;
  }

  async updateCampaign(param, receipt, receiptData) {
    console.log('Update Campaign with: ', param, receipt, receiptData);

    const campaign = CampaignModel.query().where(function () {
      this.where('campaign_hash', '=', param.params.pool)
        .orWhere('transaction_hash', '=', param.txHash)
    }).update({
      campaign_hash: param.params.campaign,
      campaign_id: param.params.poolId,
      registed_by: param.params.registedBy,
      transaction_hash: param.txHash,
      token: param.params.token,
      title: receipt[2],
      start_time: receipt[0],
      finish_time: receipt[1],
      token_conversion_rate: receipt[3],
      funding_wallet_address: receipt[6],
      is_pause: receipt[7],
      ether_conversion_rate: new BigNumber(receipt[4]).dividedBy(Math.pow(10, receipt[5])).toFixed(),
      name: receiptData[0],
      decimals: receiptData[1],
      symbol: receiptData[2],
      affiliate: false,
      is_deploy: true,
    });
    return campaign;
  }

  async editCampaign(receipt, campaign) {
    try {
      await CampaignModel.query().where('campaign_hash', campaign)
        .update({
          title: receipt[2],
          start_time: receipt[0],
          finish_time: receipt[1],
          affiliate: false, // receipt[3] == Config.get('const.zero_hex') ? false : true,
          token_conversion_rate: receipt[4],
          ether_conversion_rate: new BigNumber(receipt[5]).dividedBy(Math.pow(10, receipt[7])).toFixed(),
          is_pause: receipt[6],
          funding_wallet_address: receipt[7]
        })
      return true
    } catch (e) {
      console.log('ERROR', e);
      return ErrorFactory.internal('error')
    }
  }
  async getUserMaxBuy(wallet_address,campaign_id){
    
  // this function caculator maxBuy by tier and max buy basic. It musst hve data in whitelist winnerList and percentage|| multiple in tier Table
  // so  it must call after all data is confirmed( after deploy)
    const winnerListService=new WinnerListService()
    const result= await winnerListService.countBytier(campaign_id)
    const counByTier = Object.values(JSON.parse(JSON.stringify(result)));
    console.log('=============count number of user in winner list ByTier============',counByTier)

    const camp = (await CampaignModel.query().where('id', campaign_id).fetch()).toJSON();
    if(!camp[0].is_deploy) return 0
    const fcfs = (await FcfsRoundModel.query().where('campaign_id', campaign_id).fetch()).toJSON();
    const current = ConvertDateUtils.getDatetimeNowUTC();
    console.log(`Current time is ${current} start join pool is ${camp[0].start_join_pool_time} end time is ${camp[0].finish_time}`);
    const is_Winner = await (new WinnerListService()).findOneByFilters({ wallet_address, campaign_id });
    const is_Reserved = await(new ReservedListService()).findOneByFilter({ wallet_address, campaign_id });
    console.log('-------------------fcfs setting ---------------',fcfs)
    const timeR1 = new Number(camp[0].finish_time) - new Number(fcfs[0].before_buy_end_time) * 60;//fcfs phase 1
    const timeR2 = new Number(camp[0].finish_time) - new Number(fcfs[1].before_buy_end_time) * 60;//fcfs phase 2
    const timeR3 = new Number(camp[0].finish_time) - new Number(fcfs[2].before_buy_end_time) * 60;//fcfs phase 3
    const timeR4 = new Number(camp[0].finish_time) - new Number(fcfs[3].before_buy_end_time) * 60;//fcfs phase 4
    let percentMultiple = 0;    // normal phase 
    const finish_round=camp[0].finish_round
    if(!finish_round){
    if (timeR1 <= current && current< timeR2  )  {
      percentMultiple = new Number(fcfs[0].allocation_bonus);
      console.log('it FSFS round 1 ',timeR1 )
      console.log(percentMultiple)
    };
     if (timeR2 <= current && current < timeR3 ) {
      percentMultiple =new Number(fcfs[1].allocation_bonus);
      console.log('it FSFS round 2 ',timeR2)

    }
     if (timeR3 <= current&& current< timeR4) {
      percentMultiple = new Number(fcfs[2].allocation_bonus);
      console.log('it FSFS round 3 ',timeR3)
    };
    }else {
      switch (finish_round) {
        case 1:
          percentMultiple = new Number(fcfs[0].allocation_bonus);
          break;
        case 2:
          percentMultiple =new Number(fcfs[1].allocation_bonus);
          break;
        case 3:
          percentMultiple = new Number(fcfs[2].allocation_bonus);
          break;
      }  
    }
    var userTier
    if(is_Winner){ 
      percentMultiple+=100 
      userTier=is_Winner?.level||0
    } 
    // winner get bonus percent compare normal phase , reserved just buy with this bonus percent 
    else if(is_Reserved){
      userTier=is_Reserved?.level||0
    }
    else { 
      percentMultiple=0 // if not in whiterlist(not in winner or Reserved) usser can buy token until FCFS4
      userTier=0
    }
    console.log('--------------your percent multiple is :',percentMultiple)
    
    // const userTier = (await HelperUtils.getUserTierSmart(wallet_address))[0];
    console.log("your tier in this pool is ",userTier)
    var maxBuyBasicByTier = (await TierModel.query().where('campaign_id', campaign_id).where('level', userTier).first()).toJSON();

    // const tier_campain = (await TierModel.query().where('campaign_id', campaign_id).fetch()).toJSON();

    // if  max buy basic for each tier(in tier table) is not calculator .Excecute this logic to caculator max buy and save to DB 

    let  maxBuy = maxBuyBasicByTier.max_buy*percentMultiple/100;
    if ((!finish_round &&current >= timeR4)|| finish_round===4){ 
      console.log("All user can buy max cap in FCFS round 4: start from",timeR4)
      maxBuy = camp[0].total_sold_coin; 
    }
    // console.log('========== Your can buy Maximum ============',maxBuy)

    // if(maxBuy>camp[0].total_sold_coin) maxBuy=camp[0].total_sold_coin
    
    console.log('========== Your can buy Maximum ============',maxBuy)
    return maxBuy
  };

  async getTokenRemainOfCampain(camp){
    const contract = await HelperUtils.getContractInstance(camp);
    let totalSold = await contract.methods.tokenSold().call();
    totalSold = new BigNumber(totalSold).div(Math.pow(10, camp.decimals || 0)).toFixed();
    let remainToken= camp.total_sold_coin-totalSold
    console.log("remain coin in this campain", remainToken)
    return remainToken
  }

  async baseMaxBuy(campaign_id) {
    const winnerListService=new WinnerListService()
    const result= await winnerListService.countBytier(campaign_id)
    const counByTier = Object.values(JSON.parse(JSON.stringify(result)));
    const camp = (await CampaignModel.query().where('id', campaign_id).fetch()).toJSON();
    const tier_campain = (await TierModel.query().where('campaign_id', campaign_id).fetch()).toJSON();

    if(camp[0].is_use_allocation_percent){
      console.log("-------------campain is use allocation percent----------------")

      for (let i=0; i<tier_campain.length ; i++){
        // console.log(tier_campain[i].level)
      let data= counByTier.filter(function(e){
          return e.level===tier_campain[i].level;
      })
      // console.log(data)
      const tier_data = await TierModel.query().where('campaign_id', campaign_id).where('level', tier_campain[i].level).first();
      // console.log("----------tier data",tier_data.toJSON().percent)
      let maxBuy
      if(!data[0]||tier_data.percent===0|| !tier_data.percent|| data[0].total==0) maxBuy=0
        else maxBuy=new BigNumber(camp[0].total_sold_coin*tier_data.percent/100/data[0].total).toFixed();
      tier_data.merge({
          max_buy: maxBuy,
          is_calculator:1,
      });
      console.log(`basic max Buy of tier ${tier_campain[i].level} is ${maxBuy}`)
      tier_data.save();
      }
    }
    else {
    console.log("----------campain is use multiple allocation -------------------")
    var total =0;
    for (let i=0; i<tier_campain.length; i++){
      let data= counByTier.filter(function(e){
        return e.level===tier_campain[i].level;
      })

      if( !data[0] || !tier_campain[i].multiple) continue;
      // if(tier_campain[i].multiple===null) return HelperUtils.responseErrorInternal("Some tier is not set multiple allocation !");
      total=total+tier_campain[i].multiple*data[0].total;
    }
    console.log('-------------total multiple winner -----------------',total)

    // if(total===0) return HelperUtils.responseErrorInternal("there are no winner in winner list or all multiple allocation for tier setting =0!"); 
    var baseAllocation;
    if(total===0)  baseAllocation=camp[0].total_sold_coin
    else{ baseAllocation= camp[0].total_sold_coin/total;
    }
    console.log('---------Base Allocation of all Tier --------',baseAllocation)

    for (let i=0; i<tier_campain.length ; i++){
      const tier_data = await TierModel.query().where('campaign_id', campaign_id).where('level', tier_campain[i].level).first();
      let maxBuy
      if(tier_data.multiple===0|| !tier_data.multiple) maxBuy=0
      else maxBuy=new BigNumber(baseAllocation*tier_data.multiple).toFixed();
      console.log('----------------------maxBuy: ',maxBuy);
      tier_data.merge({
          max_buy: maxBuy,
          is_calculator:1,
      });
      console.log(`basic max Buy of tier ${tier_campain[i].level} is ${maxBuy}`)
      tier_data.save();
      }
    }
  
   // get new data after calculator 
  //  maxBuyBasicByTier = (await TierModel.query().where('campaign_id', campaign_id).where('level', userTier).first()).toJSON();
  }

  async addCampaign(data) {
    try {
      const campaign = new CampaignModel;
      campaign.title = data.title;
      campaign.token = data.token;
      campaign.start_time = data.start_time;
      campaign.finish_time = data.finish_time;
      campaign.funding_wallet_address = data.addressReceiver;
      campaign.name = data.name;
      campaign.symbol = data.symbol;
      campaign.decimals = data.decimals;
      campaign.ether_conversion_rate = data.tokenByETH;
      campaign.registed_by = data.owner;
      campaign.transaction_hash = data.transactionHash;
      campaign.description = data.description;
      campaign.is_pause = Config.get('const.processingValue');
      await campaign.save();

      this.updateCampaignTx(campaign.id, data.transactionHash, Const.TX_UPDATE_ACTION.CAMPAIGN_REGISTER);
      this.dispatchTransactionTracking({
        txHash: data.transactionHash,
        txTable: Const.TX_TABLE.CAMPAIGN,
        id: campaign.id,
        action: Const.TX_UPDATE_ACTION.CAMPAIGN_REGISTER,
      });

      return campaign;
    } catch (e) {
      console.log('ERROR', e);
      return ErrorFactory.internal('error')
    }
  }

  async changeCampaign(data) {
    try {
      const campaign = await CampaignModel.query().where('transaction_hash', data.transactionHash)
        .update({
          title: data.title,
          token: data.token,
          start_time: data.start_time,
          finish_time: data.finish_time,
          funding_wallet_address: data.addressReceiver,
          name: data.name,
          symbol: data.symbol,
          decimals: data.decimals,
          ether_conversion_rate: data.tokenByETH,
          registed_by: data.owner,
          description: data.description,
          is_pause: Config.get('const.processingValue'),
        });
      return campaign;
    } catch (e) {
      console.log('ERROR', e);
      return ErrorFactory.internal('error')
    }
  }

  async dispatchTransactionTracking(data) {
    console.log('Dispatch Job CheckTxStatus with data: ', data);
    CheckTxStatus.doDispatch(data);
  }

  async updateCampaignTx(id, txHash, action) {
    if (
      action == Const.TX_UPDATE_ACTION.CAMPAIGN_REGISTER ||
      action == Const.TX_UPDATE_ACTION.CAMPAIGN_ACTIVATION
    ) {
      return await CampaignModel.query()
        .where('id', id)
        .update({
          blockchain_status:
            Const.CAMPAIGN_BLOCKCHAIN_STATUS.REGISTRATION_WAITING_CONFIRMATION,
          registration_tx: txHash
        });
    }

    if (action == Const.TX_UPDATE_ACTION.CAMPAIGN_UPDATE) {
      return await CampaignModel.query()
        .where('id', id)
        .update({
          blockchain_status: Const.CAMPAIGN_BLOCKCHAIN_STATUS.REGISTRATION_WAITING_CONFIRMATION,
        });
    }

    return await CampaignModel.query()
      .where('id', id)
      .update({
        blockchain_status: Const.CAMPAIGN_BLOCKCHAIN_STATUS.DELETION_WAITING_CONFIRMATION,
        deleted_tx: txHash
      });
  }

  async updateTxCampaignStatusFailed(txHash) {
    const updatedRow1 = await CampaignModel.query()
      .where('registration_tx', txHash)
      .update({
        blockchain_status: Const.CAMPAIGN_BLOCKCHAIN_STATUS.REGISTRATION_TX_FAILED
      });
    const updatedRow2 = await CampaignModel.query()
      .where('deleted_tx', txHash)
      .update({
        blockchain_status: Const.CAMPAIGN_BLOCKCHAIN_STATUS.DELETION_TX_FAILED
      });

    return updatedRow1 + updatedRow2;
  }

  async updateTxStatusSuccess(txHash) {
    const tx = await web3.eth.getTransaction(txHash);

    console.log('TRANSACTION: ', tx);
    console.log('BLOCK: ', tx.blockNumber);

    const campaign = await CampaignModel.query().where('transaction_hash', '=', txHash).update({
      // is_pause: Const.ACTIVE,
      blockchain_status: Const.CAMPAIGN_BLOCKCHAIN_STATUS.REGISTRATION_CONFIRMED,
    });

    return campaign;
  }

  async getCampaignByFilter(status, param, wallet_address = null) {
    const limit = param.limit ? param.limit : Config.get('const.limit_default');
    const page = param.page ? param.page : Config.get('const.page_default');
    const dateNow = Date.now() / 1000;
    let listData = CampaignModel.query()
    if (wallet_address) {
      listData = listData.where('registed_by', wallet_address)
    }
    if (param.sort_by) {
      listData = listData.orderBy(param.sort_by, 'DESC')
    }
    if (param.title) {
      listData = listData.where('title', 'like', '%' + param.title + '%')
    }
    if (status && status === 1) {
      listData = listData.where('finish_time', '>=', dateNow)
        .where('start_time', '<=', dateNow)
    }
    if (status && status === 2) {
      listData = listData.where('start_time', '>=', dateNow)
    }
    if (status && status === 3) {
      listData = listData.where('finish_time', '<=', dateNow)
    }
    listData = await listData.paginate(page, limit);
    return listData
  }

  async unJoinCampaign(campaign_id, wallet_address) {
    const existWl = await WhitelistModel.query()
      .where('wallet_address', wallet_address)
      .where('campaign_id', campaign_id).first();
    console.log(existWl)

    const isReserved =await ReservedListModel.query()
    .where('wallet_address', wallet_address)
    .where('campaign_id', campaign_id).first();

    const  isWinner= await WinnerListModel.query()
    .where('wallet_address', wallet_address)
    .where('campaign_id', campaign_id).first();

    const isWhitelistSubmission =await WhitelistSubmissionModel.query()
    .where('wallet_address', wallet_address)
    .where('campaign_id', campaign_id).first();

    if(isWhitelistSubmission) await isWhitelistSubmission.delete()
    if(isReserved) await isReserved.delete()
    if(isWinner) await isWinner.delete()

    if (existWl) {
      // // Try Un-mount and Re-mount foreign key relation `whitelist_user_id` in table `whitelist_submission`
      // // to other `whitelist_user_id`
      // let otherWhitelist = await WhitelistModel.query()
      //   .where('wallet_address', wallet_address)
      //   .where('campaign_id', '!=', campaign_id).first();
      // if (otherWhitelist) {
      //   otherWhitelist = JSON.parse(JSON.stringify(otherWhitelist));
      //   // Re-mount to other `whitelist_user_id` record
      //   await WhitelistSubmissionModel.query().where('wallet_address', wallet_address).update({
      //     whitelist_user_id: otherWhitelist.id
      //   });
      // } else {
      //   await WhitelistSubmissionModel.query().where('wallet_address', wallet_address).update({
      //     whitelist_user_id: null
      //   });
      // }
      //
      // // Delete without foreignKey `whitelist_user_id`
      await existWl.delete();
      // Log record canceled apply whitelist
      
    }
    const canceledApplyWhitelist = new CanceledApplyWhitelist;
    canceledApplyWhitelist.fill({ campaign_id, wallet_address });
    await canceledApplyWhitelist.save();
    return true;
  }

  // investor join campaign
  async joinCampaign(campaign_id, wallet_address, email,userTier) {

    // check for whitelist submission
    const whitelistSubmission = await WhitelistSubmissionModel.query().where('wallet_address', wallet_address)
      .where('campaign_id', campaign_id).first();
    if (!whitelistSubmission) {
      ErrorFactory.badRequest("User haven't submitted the white list application form");
    }

    // if(userTier<=3){
      // check exist whitelist with wallet and campaign
      const existWl = await WhitelistModel.query()
      .where('wallet_address', wallet_address)
      .where('campaign_id', campaign_id).first();
    if (existWl != null) {
      console.log(`Existed record on whitelist with the same wallet_address ${wallet_address} and campaign_id ${campaign_id}`);
      ErrorFactory.badRequest('Bad request duplicate  with wallet_address  ' + wallet_address);
    }
    // insert to whitelist table
    const whitelist = new WhitelistModel();
    whitelist.wallet_address = wallet_address;
    whitelist.campaign_id = campaign_id;
    whitelist.email = email;
    whitelist.tier=userTier;
    await whitelist.save();
    whitelistSubmission.merge({ whitelist_user_id: whitelist.id });
    await whitelistSubmission.save();
    // }
    
    if(userTier>3) {
            // check exist whitelist with wallet and campaign
      const existWinner = await WinnerListModel.query()
      .where('wallet_address', wallet_address)
      .where('campaign_id', campaign_id).first();
      if (existWinner != null) {
        console.log(`Existed record on Winnerlist with the same wallet_address ${wallet_address} and campaign_id ${campaign_id}`);
        ErrorFactory.badRequest('Bad request duplicate with wallet_address ' + wallet_address);
      }   
      const winnerList = new WinnerListModel();
      winnerList.wallet_address = wallet_address;
      winnerList.campaign_id = campaign_id;
      winnerList.email = email;
      winnerList.level=userTier;
      await winnerList.save();
      // winnerList.merge({ whitelist_user_id: whitelist.id });
      // await whitelistSubmission.save();
  
    }
    // remove all old key of white list on redis
    // key regex
    const redisKeyRegex = 'whitelist_' + campaign_id + '*';
    // find all key matched with key regex
    const keys = await Redis.keys(redisKeyRegex);
    for (const key of keys) {
      console.log(key);
      await Redis.del(key);
    }
  }

  async findByCampaignId(campaign_id) {
    let builder = CampaignModel.query().where('id', campaign_id);
    return await builder.first();
  }

  async updatePickWinnerRule(campaign_id, rule) {
    const campaign = this.findByCampaignId(campaign_id);
    if (!campaign) {
      return false;
    }
    let result = CampaignModel.query().where('id', campaign_id).update({
      pick_winner_rule: rule
    });
    return result;
  }
}

module.exports = CampaignService;
