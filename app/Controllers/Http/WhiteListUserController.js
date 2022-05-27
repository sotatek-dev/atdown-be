'use strict'

const WhitelistService = use('App/Services/WhitelistUserService')
const TierService = use('App/Services/TierService');
const WinnerListUserService =use('App/Services/WinnerListUserService');
const ReservedListService =use('App/Services/ReservedListService');
const WinnerListModel = use('App/Models/WinnerListUser');
const ReservedListModel = use('App/Models/ReservedList');
const CampaignModel = use('App/Models/Campaign');
const FakeUser = use('App/Models/FakeUser');

const Database = use('Database')
// const UserController =use('App/Controllers/Http/UserController');
const HelperUtils = use('App/Common/HelperUtils');
// const PickRandomWinnerJobWithWeightRate = use('App/Jobs/PickRandomWinnerJobWithWeightRate');
// const PickRandomWinnerNormalRule = use('App/Jobs/PickRandomWinnerNormalRule');
// const PickRandomWinnerJobWithLuckyDove = use('App/Jobs/PickRandomWinnerJobWithLuckyDove');
// const PickLuckyDoveHawkAndWeightEaglePhoenix = use('App/Jobs/PickLuckyDoveHawkAndWeightEaglePhoenix');
const RedisUtils = use('App/Common/RedisUtils');
const Const = use('App/Common/Const');
const _ = require('lodash');

class WhiteListUserController {
  async getWhiteList( {request} ) {
    // get request params
    const params = request.all();
    const campaign_id = params.campaignId;
    console.log('request: ',request.all())
    const page = params.page;
    const pageSize = params.limit ? params.limit : 10;
    console.log(`start getWhiteList with campaign_id ${campaign_id} and page ${page} and pageSize ${pageSize}`);
    try {
      // get from redis cached
      // let redisKey = 'whitelist_' + campaign_id;
      // if (page) {
      //   redisKey = redisKey.concat('_', page, '_', pageSize);
      // }
      // if (await Redis.exists(redisKey)) {
      //   console.log(`existed key ${redisKey} on redis`);
      //   const cachedWL = await Redis.get(redisKey);
      //   return HelperUtils.responseSuccess(JSON.parse(cachedWL));
      // }
      // if not existed whitelist on redis then get from db
      // const filterParams = {
      //   'campaign_id': campaign_id,
      //   'page': page,
      //   'pageSize': pageSize
      // };
      const whitelistService = new WhitelistService();
      console.log('whitelistService : ',whitelistService )
      await whitelistService.addSubmitToWhitelist(campaign_id);
      // get winner list
      // const whitelist = await whitelistService.findWhitelistUser(filterParams);
      // // save to redis
      // // await Redis.set(redisKey, JSON.stringify(whitelist));
      // return HelperUtils.responseSuccess(whitelist);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Get Whitelist Failed !');
    }
  }

  async getParticipants({ request }) {
    // get request params
    const campaign_id = request.params.campaignId;
    const page = request.input('page');
    const pageSize = request.input('limit') ? request.input('limit') : 10;
    const whiteListPending = request.input('whitelist_pending') ? request.input('whitelist_pending') === 'true' : false;
    console.log(`start getWhiteList with campaign_id ${campaign_id} and page ${page} and pageSize ${pageSize}`);
    try {
      // get from redis cached
      // let redisKey = 'whitelist_' + campaign_id;
      // if (page) {
      //   redisKey = redisKey.concat('_', page, '_', pageSize);
      // }
      // if (await Redis.exists(redisKey)) {
      //   console.log(`existed key ${redisKey} on redis`);
      //   const cachedWL = await Redis.get(redisKey);
      //   return HelperUtils.responseSuccess(JSON.parse(cachedWL));
      // }
      // if not existed whitelist on redis then get from db
      const filterParams = {
        'campaign_id': campaign_id,
        'page': page,
        'pageSize': pageSize,
        'whitelist_pending': whiteListPending,
        'search_term': request.input('search_term') || '',
      };
      const whitelistService = new WhitelistService();
      // get winner list
      const whitelist = await whitelistService.findWhitelistUser(filterParams);
      // save to redis
      // await Redis.set(redisKey, JSON.stringify(whitelist));
      return HelperUtils.responseSuccess(whitelist);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Get Whitelist Failed !');
    }
  }

  async deleteWhiteList({ request, params }) {
    try {
      console.log('[deleteWhiteList] - Delete WhiteList with params: ', params, request.params);

      const { campaignId, walletAddress } = params;
      const whitelistService = new WhitelistService();
      const existRecord = await whitelistService.buildQueryBuilder({
        campaign_id: campaignId,
        wallet_address: walletAddress,
      }).first();
      if (existRecord) {
        await existRecord.delete();
      }
      console.log('existRecord', existRecord);
      return HelperUtils.responseSuccess(existRecord);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Delete white list fail !');
    }
  }

  async getRandomWinners({ request }) {
    const campaign_id = request.params.campaignId;
    const tierParam = Number(request.params.tier); // tier to loter(1,2,3)
    if(![1,2,3].includes(tierParam)) return HelperUtils.responseBadRequest('Do not lotery with tiers different from 1,2 or 3 ');
    const maxNumber= request.all().number; 
    console.log(`lotery maximum ${maxNumber} winner with campaign ${campaign_id} and tier ${tierParam}`);
    try {
      // get tier setting from db
      const tierService = new TierService();
      const oldTiers = await tierService.findAllByFilter({ 'campaign_id': campaign_id });
      if (oldTiers === undefined || oldTiers.length === 0) {
        console.log(`Do not found tiers with campaign ${campaign_id}`);
        return HelperUtils.responseBadRequest('Do not found tiers with campaign request');
      }
      const camp = (await CampaignModel.query().where('id', campaign_id).fetch()).toJSON();
      if (!camp) {
        console.log(`Do not found campaign with id ${campaign_id}`);
        return HelperUtils.responseBadRequest("Do not found campaign");
      }
      if (camp[0].is_deploy===1) {
        return HelperUtils.responseBadRequest("Campain is deploy can not lotery");
      }

      if(tierParam<camp[0].min_tier) {
        return HelperUtils.responseBadRequest("this tier is not require to join this campain");

      }
      let percent=0;
      switch (tierParam) {
      case 1:
      percent=Const.WIN_PERCENT_BY_TIER.TIER_1;
      break
      case 2:
      percent=Const.WIN_PERCENT_BY_TIER.TIER_2;
      break
      case 3:
      percent=Const.WIN_PERCENT_BY_TIER.TIER_3;
      break
      default:
      }
    const whitelistService = new WhitelistService();
    const loteriedList = await whitelistService.getLoteriedList(campaign_id);
    // console.log("=================loteriedList,",loteriedList)
    // const result = await whitelistService.addSubmitToWhitelist(campaign_id)
    // return result
    // get users are not lotery yet in whitelist
    const whitelist = await Database
    .from('whitelist_users')
    .whereNotIn(
    'wallet_address', loteriedList
    )
    .where('campaign_id',campaign_id)
    .andWhere('tier', tierParam)

    const whitelistData= JSON.parse(JSON.stringify(whitelist));
   
    console.log('------------------list users need check lotery ', whitelistData);

    if(!whitelistData.length){
      return HelperUtils.responseSuccess(null, "All user in whitelist has been raffled lotery yet!")
    }

    //lotery
    var winList=[];
    var reservedList=[];
    for (let i = 0; i < whitelistData.length; i++) {
      // //check tier of each user in list need to check lotery
      // if (await RedisUtils.checkExistRedisUserTierBalance(whitelistData[i].wallet_address)){
      //   const cached = JSON.parse(await RedisUtils.getRedisUserTierBalance(whitelistData[i].wallet_address));
      //   const tierCacheTimeToLive = 5 * 60 * 1000 // 5 minutes

      //   if ((new Date()).getTime() - cached.updatedAt < tierCacheTimeToLive) {
      //      tier =cached.data[0];
      //       // stakedInfo: cached.data[3],
      //   }
      //   else{
      //   const tierInfo = await HelperUtils.getUserTierSmart(whitelistData[i].wallet_address);
      //    RedisUtils.createRedisUserTierBalance(whitelistData[i].wallet_address, tierInfo);
      //   tier= Number(tierInfo[0]) || 0;
      //   }
      // }else {
      // const tierInfo = await HelperUtils.getUserTierSmart(whitelistData[i].wallet_address);
      // RedisUtils.createRedisUserTierBalance(whitelistData[i].wallet_address, tierInfo);
      // tier= Number(tierInfo[0]) || 0;
      // }

      // if(tier<camp[0].min_tier) continue ;

      const data={
        email:whitelistData[i].email,
        wallet_address : whitelistData[i].wallet_address,
        campaign_id : campaign_id,
        level:tierParam,
      }
        if( percent>Math.floor(Math.random() * 101)){
          winList.push(data)
        }
        else reservedList.push(data)
    } 

    // check winnerListUser to ensure have at least one winner of this tier.It not get one from reservedList
    const isHaveWinner= await WinnerListModel.query().where('campaign_id',campaign_id).where('level',tierParam).first();
    if(!isHaveWinner&&tierParam>= camp[0].min_tier && winList.length===0){
    winList=_.sampleSize(reservedList,1)
    reservedList=_.difference(reservedList,winList)
    }

    // shuffle winList in random order
    if(winList.length!==0) winList = _.shuffle(winList);
    
    // get maximun winner
    if ( winList.length>maxNumber){
      reservedList = reservedList.concat(winList.slice(maxNumber,winList.length));
      winList=winList.slice(0,maxNumber)
    }

    console.log("------------winlist after filter max winner number----------------------",winList)
    console.log("----------- reservedList after filter max winner number-----------------",reservedList)

    await WinnerListModel.createMany(winList);
    await ReservedListModel.createMany(reservedList);

      return HelperUtils.responseSuccess(winList, "Pickup random winner successful with winner !")
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Get Random Winners Failed !');
    }
  }
  
  async search({ request }) {
    // get request params
    const searchParams = {
      'campaign_id': request.params.campaignId,
      'email': request.input('email'),
      'wallet_address': request.input('wallet_address'),
      'page': request.input('page'),
      'pageSize': request.input('limit') ? request.input('limit') : 10
    }
    try {
      const whitelistService = new WhitelistService();
      const result = await whitelistService.search(searchParams);
      return HelperUtils.responseSuccess(result);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Find Whitelist Error !');
    }
  }

  // async getRandomWinnersFake({ request }) {
  //   const campaign_id = request.params.campaignId;
  //   const tierParam = Number(request.params.tier); // tier to loter(1,2,3)
  //   const maxNumber= request.all().number; 
  //   console.log(`lotery maximum ${maxNumber} winner with campaign ${campaign_id} and tier ${tierParam}`);
  //   try {
  //     // get tier setting from db
  //     const tierService = new TierService();
  //     const oldTiers = await tierService.findAllByFilter({ 'campaign_id': campaign_id });
  //     if (oldTiers === undefined || oldTiers.length === 0) {
  //       console.log(`Do not found tiers with campaign ${campaign_id}`);
  //       return HelperUtils.responseBadRequest('Do not found tiers with campaign request');
  //     }
  //     const camp = (await CampaignModel.query().where('id', campaign_id).fetch()).toJSON();
  //     if (!camp) {
  //       console.log(`Do not found campaign with id ${campaign_id}`);
  //       return HelperUtils.responseBadRequest("Do not found campaign");
  //     }
  //     if (!camp.is_deploy===1) {
  //       return HelperUtils.responseBadRequest("Campain is deploy can not lotery");
  //     }
  //     if(tierParam<camp[0].min_tier) {
  //       return HelperUtils.responseBadRequest("this tier is not require to join this campain");
  //     }

  //     let percent=0;
  //     switch (tierParam) {
  //     case 1:
  //     percent=Const.WIN_PERCENT_BY_TIER.TIER_1;
  //     break
  //     case 2:
  //     percent=Const.WIN_PERCENT_BY_TIER.TIER_2;
  //     break
  //     case 3:
  //     percent=Const.WIN_PERCENT_BY_TIER.TIER_3;
  //     break
  //     default:
  //     }
    
  //   // const loteryUser= (await FakeUser
  //   // .query()
  //   // .where('tier', tierParam)
  //   // .fetch()).toJSON();
  //   const whitelistService = new WhitelistService();
  //   const loteriedList = await whitelistService.getLoteriedList(campaign_id);

  //   const whitelist = await Database
  //   .from('whitelist_users')
  //   .where('campaign_id',campaign_id)
  //   .where('tier', tierParam)
  //   .whereNotIn(
  //     'wallet_address', loteriedList
  //     )
  
  //   const loteryUser= JSON.parse(JSON.stringify(whitelist));

  //   // const listUserToLotery= await 
  //   console.log('------------------list users need check lotery ', loteryUser);

  //   if(!loteryUser.length){
  //     return HelperUtils.responseSuccess(null, "All user in whitelist has been raffled lotery yet!")
  //   }

  //   //lotery
  //   var winList=[];
  //   var reservedList=[];
  //   var guranteeList=[]
  //   for (let i = 0; i < loteryUser.length; i++) {
  //     var tier  =tierParam

  //     const data={
  //       wallet_address : loteryUser[i].wallet_address,
  //       campaign_id : campaign_id,
  //       level:tier,
  //     }
  //     if( percent>Math.floor(Math.random() * 101)){
  //       winList.push(data)
  //     }
  //     else reservedList.push(data)
  //   } 

  //   // check winnerListUser to ensure have at least one winner of this tier.It not get one from reservedList
  //   const isHaveWinner= await WinnerListModel.query().where('campaign_id',campaign_id).where('level',tierParam).first();
  //   if(!isHaveWinner&&tierParam>= camp[0].min_tier && winList.length===0){
  //   winList=_.sampleSize(reservedList,1)
  //   reservedList=_.difference(reservedList,winList)
  //   }
  //   console.log("------------winlist ----------------------",winList)
  //   console.log("----------- reservedList -----------------",reservedList)

  //   // shuffle winList in random order
  //   if(winList.length!==0) winList = _.shuffle(winList);
    
  //   // get maximun winner
  //   if ( winList.length>maxNumber){
  //     reservedList = reservedList.concat(winList.slice(maxNumber,winList.length));
  //     winList=winList.slice(0,maxNumber)
  //   }

  //   console.log("------------winlist after filter max winner number----------------------",winList)
  //   console.log("----------- reservedList after filter max winner number-----------------",reservedList)
  //   console.log("------------guranteeList------------------------------------------------",guranteeList)

  //   winList=winList.concat(guranteeList)
  //   await WinnerListModel.createMany(winList);
  //   await ReservedListModel.createMany(reservedList);

  //     return HelperUtils.responseSuccess(null, "Pickup random winner successful !")
  //   } catch (e) {
  //     console.log(e);
  //     return HelperUtils.responseErrorInternal('Get Random Winners Failed !');
  //   }
  // }
  
  async addWhitelistUser({ request }) {
    try {
      const inputParams = request.only(['wallet_address', 'email', 'campaign_id']);
      const params = {
        wallet_address: inputParams.wallet_address,
        email: inputParams.email,
        campaign_id: inputParams.campaign_id,
      };
      const whitelistService = new WhitelistService();
      const user = await whitelistService.buildQueryBuilder({
        wallet_address: inputParams.wallet_address,
        campaign_id: inputParams.campaign_id,
      }).first();
      console.log('[addWhitelistUser] - user: ', user);

      if (user) {
        return HelperUtils.responseBadRequest('User Exist !');
      }
      const res = await whitelistService.addWhitelistUser(params);
      return HelperUtils.responseSuccess(res);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Add whitelist fail !');
    }
  }

}

module.exports = WhiteListUserController
