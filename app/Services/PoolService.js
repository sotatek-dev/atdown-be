'use strict'

const BigNumber = use('bignumber.js');
const pLimit = use('p-limit');
const moment = use('moment');

const CampaignModel = use('App/Models/Campaign');
const FcfsRoundSettingModel = use('App/Models/FcfsRoundSetting');
const CampaignClaimConfigModel = use('App/Models/CampaignClaimConfig');
const TierModel = use('App/Models/Tier');
const WhitelistBannerSettingModel = use('App/Models/WhitelistBannerSetting');
const SocialNetworkSettingModel = use('App/Models/SocialNetworkSetting');
const CampaignSocialRequirementModel = use('App/Models/CampaignSocialRequirement');
const FreeBuyTimeSettingModel = use('App/Models/FreeBuyTimeSetting');
const FcfsRoundModel= use('App/Models/FcfsRoundSetting');

const Config = use('Config');
const Const = use('App/Common/Const');
const HelperUtils = use('App/Common/HelperUtils');
const RedisUtils = use('App/Common/RedisUtils');
const ConvertDateUtils = use('App/Common/ConvertDateUtils');
const WhitelistService = use('App/Services/WhitelistUserService');
const UserService = use('App/Services/UserService');
const TierService = use('App/Services/TierService');
const WinnerListUserService = use('App/Services/WinnerListUserService');
const WinnerModel = use('App/Models/WinnerListUser');
const ReservedListService = use('App/Services/ReservedListService');
const UserPreOrderService = use('App/Services/UserPreOrderService');
const CanceledApplyWhitelistService = use('App/Services/CanceledApplyWhitelistService');

const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGN];
const CONTRACT_FACTORY_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGNFACTORY];

const Web3 = require('web3');
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
const { abi: CONTRACT_ABI } = CONTRACT_CONFIGS.CONTRACT_DATA;
const { abi: CONTRACT_FACTORY_ABI } = CONTRACT_FACTORY_CONFIGS.CONTRACT_DATA;
const PoolStatus = Const.POOL_STATUS;

class PoolService {
  buildQueryBuilder(params) {
    let builder = CampaignModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }

    if (params.title) {
      if (params.is_search) {
        builder = builder.where(query => {
          query.where('title', 'like', '%' + params.title + '%')
            .orWhere('symbol', 'like', '%' + params.title + '%')
          // .orWhere('token', 'like', '%' + params.title + '%')
          // .orWhere('campaign_hash's, 'like', '%' + params.title + '%');

          if ((params.title).toLowerCase() == Config.get('const.suspend')) {
            query.orWhere('is_pause', '=', 1)
          }
          if ((params.title).toLowerCase() == Config.get('const.active')) {
            query.orWhere('is_pause', '=', 0)
          }
        })
      } else {
        builder = builder.where('title', params.title);
      }
    }

    if (params.start_time && !params.finish_time) {
      builder = builder.where('start_time', '>=', params.start_time)
    }
    if (params.finish_time && !params.start_time) {
      builder = builder.where('finish_time', '<=', params.finish_time)
    }
    if (params.finish_time && params.start_time) {
      builder = builder.where('finish_time', '<=', params.finish_time)
        .where('start_time', '>=', params.start_time)
    }
    if (params.registed_by) {
      builder = builder.where('registed_by', '=', params.registed_by)
    }

    if (params.is_display === undefined) {
      builder = builder.where('is_display', '=', Const.POOL_DISPLAY.DISPLAY);
    } else {
      builder = builder.where('is_display', '=', params.is_display);
    }

    return builder;
  }

  buildSearchQuery(params) {
    return this.buildQueryBuilder({
      ...params,
      is_search: true,
    })
  }

  getPoolWithTiers(filterParams) {
    const pool = this.buildQueryBuilder(filterParams).with('tiers').with('campaignClaimConfig').first();
    return pool;
  }

  async getJoinedPools(walletAddress, params) {
    const query = this.buildSearchQuery(params).orderBy('created_at', 'DESC')
      .with('campaignClaimConfig')
      .with('preOrderUsers', (builder) => {
        builder.select('id'); // select only User ID
      });
    query.whereHas('whitelistUsers', (builder) => {
      builder.where('wallet_address', walletAddress);
    }, '>', '0');

    if (params.type == Const.POOL_IS_PRIVATE.PUBLIC ||
      params.type == Const.POOL_IS_PRIVATE.PRIVATE ||
      params.type == Const.POOL_IS_PRIVATE.SEED ||
      params.type == Const.POOL_IS_PRIVATE.COMMUNITY) {
      query.where('is_private', params.type);
    }
    let pools = await query.fetch();
    pools = JSON.parse(JSON.stringify(pools));

    // Fill User Joined Status to list Pools
    pools = await this.fillJoinedStatus(pools, walletAddress);

    // Filter Pool By Joined Status
    if (!!params.status) {
      pools = await this.filterPoolByJoinedStatus(pools, params.status);
    }

    // Fill Allowcation for Pool
    pools = await this.fillAllocationAmount(pools, walletAddress);

    // Pagination result array
    pools = HelperUtils.paginationArray(pools, params.page, params.limit);

    return pools;
  }

  async getAllPools(walletAddress, params) {
    const query = this.buildSearchQuery(params).orderBy('created_at', 'DESC')
      // .with('campaignClaimConfig')
      // .with('preOrderUsers', (builder) => {
      //   builder.select('id'); // select only User ID
      // });
    // query.whereHas('whitelistUsers', (builder) => {
    //   builder.where('wallet_address', walletAddress);
    // }, '>', '0');

    if (params.type == Const.POOL_IS_PRIVATE.PUBLIC ||
      params.type == Const.POOL_IS_PRIVATE.PRIVATE ||
      params.type == Const.POOL_IS_PRIVATE.SEED ||
      params.type == Const.POOL_IS_PRIVATE.COMMUNITY) {
      query.where('is_private', params.type);
    }
    let pools = await query.fetch();
    pools = JSON.parse(JSON.stringify(pools));

    // // Fill User Joined Status to list Pools
    // pools = await this.fillJoinedStatus(pools, walletAddress);

    // // Filter Pool By Joined Status
    // if (!!params.status) {
    //   pools = await this.filterPoolByJoinedStatus(pools, params.status);
    // }

    // // Fill Allowcation for Pool
    // pools = await this.fillAllocationAmount(pools, walletAddress);

    // Pagination result array
    pools = HelperUtils.paginationArray(pools, params.page, params.limit);

    return pools;
  }

  async fillJoinedStatus(pools, walletAddress) {
    const parallelApplyStatus = pools.map(async (pool) => {
      pool.joined_status = await this.getJoinedStatusByPoolDetails(pool, walletAddress);
    });
    await HelperUtils.PromiseAll(parallelApplyStatus);
    return pools;
  }

  async fillAllocationAmount(pools, walletAddress) {
    let user = await (new UserService()).buildQueryBuilder({ wallet_address: walletAddress }).with('preOrders').first();
    user = JSON.parse(JSON.stringify(user));
    const currentUserTier = (await HelperUtils.getUserTierSmart(walletAddress))[0];

    const parallelFindAllowcationAmount = pools.map(async (pool) => {
      if (pool.joined_status === Const.POOL_STATUS_JOINED.APPLIED_WHITELIST
        || pool.joined_status === Const.POOL_STATUS_JOINED.NOT_WIN_WHITELIST
        || pool.joined_status === Const.POOL_STATUS_JOINED.CANCELED_WHITELIST
      ) {
        pool.allowcation_amount = Const.NULL_AMOUNT;
        pool.allowcation_pre_order_amount = Const.NULL_AMOUNT;
      } else {
        pool.allowcation_amount = await this.getAllocationAmount(user, pool, currentUserTier);
        pool.allowcation_pre_order_amount = await this.getAllocationPreOrderAmount(user, pool, true);
      }
    });
    await HelperUtils.PromiseAll(parallelFindAllowcationAmount);

    return pools;
  }

  async filterPoolByJoinedStatus(pools, filterStatus) {
    return pools.filter((item) => item.joined_status === filterStatus);
  }

  async getJoinedStatusByPoolDetails(pool, wallet_address) {
    // Only for version 3 (User MY POOLS)
    const now = moment().unix();
    const campaign_id = pool.id;
    let isWinner
    // Return canceled whitelist &  not win whitelist first
    const canceledApplyWhitelistService = new CanceledApplyWhitelistService;
    const cancelRecord = await canceledApplyWhitelistService.findCanceledApplyWhitelist({ campaign_id, wallet_address });
    if (cancelRecord) {
      const reservedRecord = await (new ReservedListService).buildQueryBuilder({ wallet_address }).first();
      if (reservedRecord) {
        return Const.POOL_STATUS_JOINED.NOT_WIN_WHITELIST;
      }
      return Const.POOL_STATUS_JOINED.CANCELED_WHITELIST;
    }

    

    const whiteListRecord = await (new WhitelistService).buildQueryBuilder({ campaign_id, wallet_address }).first();
    if (!whiteListRecord) {
      return Const.POOL_STATUS_JOINED.NONE;
    }

    const pickedWinner = await (new WinnerListUserService).buildQueryBuilder({ campaign_id }).first();
    if (!pickedWinner || !pool.public_winner_status) {
      return Const.POOL_STATUS_JOINED.APPLIED_WHITELIST;
    }

    // Check whether user is in Winner list?
    isWinner = await (new WinnerListUserService).buildQueryBuilder({ campaign_id, wallet_address }).first();
    if (!isWinner) {
      return Const.POOL_STATUS_JOINED.NOT_WIN_WHITELIST;
    }

    // Only Finish End Join Time (pool.end_join_pool_time < now)
    // and Not reached Start Buy Time (now < pool.start_time)
    // pool.end_join_pool_time < now < pool.start_time
    if (now < pool.start_time) {
      return Const.POOL_STATUS_JOINED.WIN_WHITELIST;
    }

    // When time is in SWAPPING Time
    // pool.start_time <= now < pool.finish_time
    if (now < pool.finish_time) {
      return Const.POOL_STATUS_JOINED.SWAPPING;
    }

    // When time is in CLAIMABLE Time
    // pool.finish_time <= now < finishClaimActualTime (Last Claim Config + 1week)
    const finishClaimActualTime = HelperUtils.getLastClaimConfigTime(pool);
    if (now < finishClaimActualTime) {
      return Const.POOL_STATUS_JOINED.CLAIMABLE;
    }

    if (finishClaimActualTime <= now) {
      return Const.POOL_STATUS_JOINED.COMPLETED;
    }
    return Const.POOL_STATUS_JOINED.NONE;
  }

  async getUpcomingPools(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : Const.DEFAULT_LIMIT;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;

    let pools = await this.buildQueryBuilder(filterParams)
      .whereNotIn('campaign_status', [
        Const.POOL_STATUS.CLAIMABLE,
        Const.POOL_STATUS.ENDED,
      ])
      .orderBy('start_join_pool_time', 'DESC')
      .orderBy('priority', 'DESC')
      .orderBy('id', 'DESC')
      .paginate(page, limit);

    return pools;
  }

  async getFeaturedPools(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : Const.DEFAULT_LIMIT;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;

    let pools = await this.buildQueryBuilder(filterParams)
      .whereIn('campaign_status', [
        Const.POOL_STATUS.CLAIMABLE,
        Const.POOL_STATUS.ENDED,
      ])
      .orderBy('priority', 'DESC')
      .orderBy('id', 'DESC')
      .paginate(page, limit);

    return pools;
  }

  /**
   * API Pool List V3
   */
  async getActivePoolsV3(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : 100000;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;

    // Sample SQL
    // select *
    //   from `campaigns`
    //     where
    //       `is_display` = '1'
    //       and (
    //           `campaign_status` in ('Filled', 'Swap')
    //         or (`campaign_status` = 'Claimable' and `actual_finish_time` > 1625339367)
    //       )
    //     order by `priority` DESC, `start_time` ASC
    //     limit 100000;

    const now = moment().unix();
    console.log('now: ', now)
    let pools = await this.buildQueryBuilder(filterParams).select('campaigns.*')
      // .leftJoin('campaign_claim_config', 'campaigns.id', 'campaign_claim_config.campaign_id')
      .with('campaignClaimConfig')
      .where(builder => {
        builder
          // .whereIn('campaign_status', [
          //   Const.POOL_STATUS.FILLED,
          //   Const.POOL_STATUS.SWAP,
          // ])
          .where(Swap_Status => {
            Swap_Status
              .where('campaigns.start_time', '<=', now)
              .where('campaigns.finish_time', '>', now)
              .andWhere('campaigns.campaign_status', '!=', 'Ended')
          })
          // .orWhere(Filled_Status => {
          //   Filled_Status
          //     .where('campaigns.finish_time', '<=', now)
          //     .where('campaign_claim_config.start_time', '>', now)
          //     .andWhere('campaigns.campaign_status', '!=', 'Ended')
          // })
          .orWhere(builderClaim => {
            builderClaim
              .where('campaign_status', Const.POOL_STATUS.FILLED)
              .andWhere('campaigns.campaign_status', '!=', 'Ended')
          })
          .orWhere(builderClaim => {
            builderClaim
              .where('campaign_status', Const.POOL_STATUS.CLAIMABLE)
              .where('actual_finish_time', '>', now)
              .andWhere('campaigns.campaign_status', '!=', 'Ended')
          });
      })
      .orderBy('campaigns.priority', 'DESC')
      .orderBy('campaigns.start_time', 'ASC')
      .paginate(page, limit);

    return pools;
  }

  async getNextToLaunchPoolsV3(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : 100000;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;

    const now = moment().unix();
    let pools = await this.buildQueryBuilder(filterParams)
      .with('campaignClaimConfig')
      .where('end_join_pool_time', '<', now)
      .whereIn('campaign_status', [
        Const.POOL_STATUS.UPCOMING,
      ])
      .orderBy('priority', 'DESC')
      .orderBy('start_time', 'ASC')
      .paginate(page, limit);
    return pools;
  }

  async getUpcomingPoolsV3(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : 100000;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;
    const is_private = Number(filterParams.is_private) === 1 ? 1 : 0;


    const now = moment().unix();
    let pools = await this.buildQueryBuilder(filterParams)
      .with('campaignClaimConfig')
      .where('campaign_status', Const.POOL_STATUS.TBA)
      .where('is_display', Const.POOL_DISPLAY.DISPLAY)
      .where('is_private', (is_private))
      .orWhere(builder => {
        builder
          .where('end_join_pool_time', '>', now)
          .where('is_display', Const.POOL_DISPLAY.DISPLAY)
          .where('is_private', (is_private))
          .whereIn('campaign_status', [
            Const.POOL_STATUS.UPCOMING,
          ]);
      })
      .orderBy('campaigns.priority', 'DESC')
      .orderBy('campaigns.end_join_pool_time', 'ASC')
      .paginate(page, limit);
    return pools;
  }

  async getCompleteSalePoolsV3(filterParams) {
    const limit = filterParams.limit ? filterParams.limit : 100000;
    const page = filterParams.page ? filterParams.page : 1;
    filterParams.limit = limit;
    filterParams.page = page;

    // Sample Filter SQL: CompleteSalePools
    // `actual_finish_time`: field will maintaining in /app/Tasks/UpdateClaimablePoolInformationTask
    // select *
    //   from `campaigns`
    //   where
    //     `is_display` = '1'
    //     and (`campaign_status` in ('Filled', 'Ended'))
    //     or (`campaign_status` = 'Claimable' and `actual_finish_time` < '1625336933')
    //     order by `priority` DESC, `finish_time` ASC
    //     limit 100000;

    const now = moment().unix();
    let pools = await this.buildQueryBuilder(filterParams).select('campaigns.*')
      // .innerJoin('campaign_claim_config', 'campaigns.id', 'campaign_claim_config.campaign_id')
      .with('campaignClaimConfig')
      .where(builder => {
        builder
          .where('campaigns.campaign_status', Const.POOL_STATUS.ENDED)
          .orWhere(builder1 => {
            builder1
              .where('campaigns.campaign_status', Const.POOL_STATUS.CLAIMABLE)
              .where('campaigns.actual_finish_time', '<', now);
          });
      })
      .orderBy('campaigns.priority', 'DESC')
      .orderBy('campaigns.finish_time', 'DESC')
      .paginate(page, limit);

    return pools;
  }

  addDefaultClaimConfig(claim_configuration, default_datetime) {
    let claimConfigs = claim_configuration || [];
    if (claimConfigs.length === 0) {
      claimConfigs = [{
        minBuy: 0,
        maxBuy: 100,
        endTime: null,
        startTime: default_datetime,
      }];
    }
    return claimConfigs;
  }

  async updateFcfsRoundsSetting(campaign, fcfs_rounds_setting) {
    const fcfsRoundsSetting = fcfs_rounds_setting.map((item, index) => {
      const fcfsRoundSettingObj = new FcfsRoundSettingModel();

      fcfsRoundSettingObj.fill({
        phase_number: index + 1,
        allocation_bonus: item.allocation_bonus,
        before_buy_end_time: item.before_buy_end_time,
      });

      return fcfsRoundSettingObj;
    });

    await campaign.fcfsRoundsSetting().delete();
    await campaign.fcfsRoundsSetting().saveMany(fcfsRoundsSetting);
  }

  async updateClaimConfig(campaign, claim_configuration) {
    const campaignClaimConfigs = claim_configuration.map((item, index) => {
      const tierObj = new CampaignClaimConfigModel();
      tierObj.fill({
        start_time: item.startTime,
        end_time: item.endTime,
        min_percent_claim: new BigNumber(item.minBuy || 0).toFixed(),
        max_percent_claim: new BigNumber(item.maxBuy || 0).toFixed(),
      });
      return tierObj;
    });

    await campaign.campaignClaimConfig().delete();
    await campaign.campaignClaimConfig().saveMany(campaignClaimConfigs);
  }

  async updateTierConfig(campaign, tier_configuration) {
    const tiers = tier_configuration.map((item, index) => {
      const tierObj = new TierModel();
      tierObj.fill({
        level: index,
        name: item.name,
        // start_time: moment.utc(item.startTime).unix(),
        // end_time: moment.utc(item.endTime).unix(),
        start_time: item.startTime,
        end_time: item.endTime,

        min_buy: new BigNumber(item.minBuy || 0).toFixed(),
        max_buy: new BigNumber(item.maxBuy || 0).toFixed(),
        ticket_allow_percent: new BigNumber(item.ticket_allow_percent || 0).toFixed(),
        ticket_allow: new BigNumber(item.ticket_allow || 0).toFixed(),
        percent: new BigNumber(item.percent || 0).toFixed(),
        multiple: new BigNumber(item.multiple || 0).toFixed(),
        currency: item.currency,
      });
      return tierObj;
    });
    await campaign.tiers().delete();
    await campaign.tiers().saveMany(tiers);

    console.log('inputParams.tier_configuration', JSON.stringify(tiers));
  }

  async updateWhitelistSocialRequirement(campaign, data) {
    if (!data.self_twitter && !data.self_group && !data.self_channel && !data.self_retweet_post
      && !data.partner_twitter && !data.partner_group && !data.partner_channel && !data.partner_retweet_post && !data.gleam_link) {
      await campaign.socialRequirement().delete();
      console.log('WhitelistSocialRequirement cleared', data);
      return true;
    }

    const requirement = new CampaignSocialRequirementModel();
    requirement.fill(data);
    console.log('[updateWhitelistSocialRequirement] - updating', JSON.stringify(requirement));
    await campaign.socialRequirement().delete();
    await campaign.socialRequirement().save(requirement);

    console.log('WhitelistSocialRequirement updated', JSON.stringify(requirement));
  }

  async updateWhitelistBannerSetting(campaign, data) {
    if (!data.guide_link && !data.whitelist_link && !data.announcement_time) {
      await campaign.whitelistBannerSetting().delete();
      console.log('WhitelistBannerSetting Clear', data);
      return true;
    }

    const setting = new WhitelistBannerSettingModel();
    setting.fill(data);
    console.log('[updateWhitelistBannerSetting] - setting', JSON.stringify(setting));
    await campaign.whitelistBannerSetting().delete();
    await campaign.whitelistBannerSetting().save(setting);

    console.log('WhitelistBannerSetting Setting', JSON.stringify(setting));
  }

  async updateSocialNetworkSetting(campaign, data) {
    const setting = new SocialNetworkSettingModel();
    setting.fill(data);

    console.log('[updateSocialNetworkSetting] - setting', JSON.stringify(setting));
    await campaign.socialNetworkSetting().delete();
    await campaign.socialNetworkSetting().save(setting);

    console.log('SocialNetwork Setting', JSON.stringify(setting));
  }

  async updateFreeBuyTimeSetting(campaign, data) {
    const setting = new FreeBuyTimeSettingModel();
    setting.fill(data);

    console.log('[updateSocialNetworkSetting] - setting', JSON.stringify(setting));
    await campaign.freeBuyTimeSetting().delete();
    await campaign.freeBuyTimeSetting().save(setting);

    console.log('FreeBuyTime Setting', JSON.stringify(setting));
  }

  async getPoolRedisCache(poolId) {
    try {
      if (await RedisUtils.checkExistRedisPoolDetail(poolId)) {
        const cachedPoolDetail = await RedisUtils.getRedisPoolDetail(poolId);
        console.log('[getPoolRedisCache] - Exist cache data Public Pool Detail: ', cachedPoolDetail);
        if (cachedPoolDetail) {
          return JSON.parse(cachedPoolDetail);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async getPoolById(poolId, byCache = true) {
    const pool = await CampaignModel.query().where('id', poolId).first();
    return pool;
  };

  async checkPoolExist(poolId) {
    const pool = this.getPoolById(poolId);
    return !!pool;
  };

  /**
   * Task Update Pool Status / Token Sold
   */
  async filterPoolClaimable() {
    let pools = await CampaignModel.query()
      .with('campaignClaimConfig')
      .where('campaign_status', Const.POOL_STATUS.CLAIMABLE)
      .orderBy('id', 'DESC')
      .fetch();
    pools = JSON.parse(JSON.stringify(pools));
    console.log('[filterPoolClaimable] - pools.length:', pools.length);
    return pools;
  }

  async filterActivePoolWithStatus() {
    let pools = await CampaignModel.query()
      .with('campaignClaimConfig')
      .whereNull('campaign_status')
      .orWhere(builder => {
        builder
          .whereNotIn('campaign_status', [
            Const.POOL_STATUS.ENDED,
            Const.POOL_STATUS.CLAIMABLE
          ])
        // .where('campaign_status', '!=', Const.POOL_STATUS.ENDED)
        // .where('campaign_status', '!=', Const.POOL_STATUS.CLAIMABLE)
      })
      .orderBy('updated_at', 'ASC')
      .limit(5)
      .fetch();
    pools = JSON.parse(JSON.stringify(pools));
    console.log('[filterPoolWithStatus] - pools.length:', pools.length);
    return pools;
  }

  async runUpdatePoolStatus() {
    const pools = await this.filterActivePoolWithStatus();
    const limit = pLimit(10);
    await Promise.all(
      pools.map(async pool => {
        return limit(async () => {
          this.updatePoolInformation(pool);
        })
      })
    ).then((res) => {
      console.log('[runUpdatePoolStatus] - Finish');
    }).catch((e) => {
      console.log('[runUpdatePoolStatus] - ERROR: ', e);
    });

    return pools;
  }

  async updatePoolInformation(pool) {
    try {
      const tokenSold = await HelperUtils.getTokenSoldSmartContract(pool);
      const status = await HelperUtils.getPoolStatusByPoolDetail(pool, tokenSold);
      const lastTime = HelperUtils.getLastActualFinishTime(pool); // lastClaimConfig + 12h
      const dataUpdate = {
        token_sold: tokenSold,
        campaign_status: status,
      };
      if (lastTime) {
        dataUpdate.actual_finish_time = lastTime;
      }
      if(status===PoolStatus.FILLED){
        const current = ConvertDateUtils.getDatetimeNowUTC();
        // dataUpdate.finish_sold_time=today
        const fcfs = (await FcfsRoundModel.query().where('campaign_id', pool.id).fetch()).toJSON();
        const timeR1 = new Number(pool.finish_time) - new Number(fcfs[0].before_buy_end_time) * 60;//fcfs phase 1
        const timeR2 = new Number(pool.finish_time) - new Number(fcfs[1].before_buy_end_time) * 60;//fcfs phase 2
        const timeR3 = new Number(pool.finish_time) - new Number(fcfs[2].before_buy_end_time) * 60;//fcfs phase 3
        const timeR4 = new Number(pool.finish_time) - new Number(fcfs[3].before_buy_end_time) * 60;//fcfs phase 4
        if(timeR1 > current){
          dataUpdate.finish_round=0 //normal swap time
        }
        if (timeR1 <= current && current< timeR2 && timeR1 <= finish_sold_time && finish_sold_time < timeR2 )  {
          dataUpdate.finish_round=1 //fcfs phase 1 
        };
         if (timeR2 <= current && current < timeR3 && timeR1 <= finish_sold_time && finish_sold_time < timeR2) {
          dataUpdate.finish_round=2
    
        }
         if (timeR3 <= current&& current< timeR4) {
          dataUpdate.finish_round=3
        };
        if ( current>= timeR4) {
          dataUpdate.finish_round=4
        };

      }
      const result = await CampaignModel.query().where('id', pool.id).update(dataUpdate);
      RedisUtils.deleteRedisPoolDetail(pool.id);
    } catch (e) {
      console.log('[PoolService::updatePoolInformation] - ERROR: ', pool.id);
      console.log('[PoolService::updatePoolInformation] - ERROR: ', e);
    }
  }

  async runUpdatePoolClaimableStatus() {
    const pools = await this.filterPoolClaimable();
    const limit = pLimit(10);
    await Promise.all(
      pools.map(async pool => {
        return limit(async () => {
          this.updatePoolInformation(pool);
        })
      })
    ).then((res) => {
      console.log('[runUpdatePoolStatus] - Finish');
    }).catch((e) => {
      console.log('[runUpdatePoolStatus] - ERROR: ', e);
    });

    return pools;
  }

  /**
   * Free Buy Time
   */
  async getFreeBuyTimeInfo(pool, walletAddress) {
    if (!pool) {
      return {
        maxBonus: 0,
        isFreeBuyTime: false,
        existWhitelist: null,
      }
    }
    const freeBuyTimeSetting = JSON.parse(JSON.stringify(pool)).freeBuyTimeSetting;
    console.log('Campaign freeBuyTimeSetting:', freeBuyTimeSetting);
    let maxBonus = freeBuyTimeSetting && freeBuyTimeSetting.max_bonus;
    const startFreeBuyTime = freeBuyTimeSetting && freeBuyTimeSetting.start_buy_time;

    const current = ConvertDateUtils.getDatetimeNowUTC();
    let isFreeBuyTime = false;
    if (maxBonus && startFreeBuyTime) {
      console.log('startFreeBuyTime:', startFreeBuyTime);
      isFreeBuyTime = Number(startFreeBuyTime) < current;
      console.log('isFreeTime', isFreeBuyTime, current);
    }

    const campaignId = pool && pool.id;
    const whitelistService = new WhitelistService;
    const existWhitelist = await whitelistService.buildQueryBuilder({
      campaign_id: campaignId,
      wallet_address: walletAddress,
    }).first();
    if (!existWhitelist) {
      isFreeBuyTime = false;
      maxBonus = 0;
    }

    console.log('[PoolService::getFreeBuyTimeInfo] - isFreeBuyTime:', isFreeBuyTime, maxBonus, startFreeBuyTime);

    return {
      maxBonus,
      startFreeBuyTime,
      isFreeBuyTime,
      existWhitelist,
    };
  }

  /**
   * User Max Buy in Pool
   */
  async caculateMaxMinBuyUserWithCurrentUserTier(user, camp, currentUserTier) {
    // This function only alias of `caculateMaxMinBuyUser` function
    // It's require `currentUserTier` params
    // to improve performance when query to Smart Contract
    return this.caculateMaxMinBuyUser(user, camp, currentUserTier);
  }

  async caculateMaxMinBuyUser(user, camp, currentUserTierInit = null) {
    const userWalletAddress = user.wallet_address;
    const wallet_address = user.wallet_address;
    const campaign_id = camp.id;
    let minBuy = 0, maxBuy = 0;
    const current = ConvertDateUtils.getDatetimeNowUTC();
    console.log(`Current time is ${current}`);
    let winner;

    // FREE BUY TIME:
    const { maxBonus, isFreeBuyTime, existWhitelist } = await this.getFreeBuyTimeInfo(camp, userWalletAddress);
    console.log('[CampaignController::deposit] - isFreeBuyTime:', isFreeBuyTime);

    if (camp.buy_type === Const.BUY_TYPE.WHITELIST_LOTTERY) {
      // check if exist in winner list
      winner = await (new WinnerListUserService()).findOneByFilters({ wallet_address, campaign_id });

      // if user not in winner list then check on reserved list
      if (!isFreeBuyTime && !winner) {
        // if user is not in winner list then check with reserved list
        const reserved = await (new ReservedListService()).findOneByFilter({ wallet_address, campaign_id });
        if (!reserved) {
          // return HelperUtils.responseBadRequest("Sorry, you are not on the list of winners to join this pool.");
          return 0;
        }
        // check time start buy for tier
        console.log(`Reserved ${reserved.start_time} ${reserved.end_time} ${current}`);
        if (reserved.start_time > current) {
          return 0;
        }
        if (reserved.end_time < current) {
          return 0;
        }
        // set min, max buy amount of user
        minBuy = reserved.min_buy;
        maxBuy = reserved.max_buy;
      }
    }

    // check user tier if user not in reserved list
    if (winner) {
      // get realtime tier from SC
      let currentTier; //= currentUserTierInit || (await HelperUtils.getUserTierSmart(userWalletAddress))[0];
      if (currentUserTierInit !== null) {
        currentTier = currentUserTierInit;
      } else {
        currentTier = (await HelperUtils.getUserTierSmart(userWalletAddress))[0];
      }
      const isInPreOrderTime = HelperUtils.checkIsInPreOrderTime(camp, currentTier);

      // if user decrement their tier then they can not buy token
      if (currentTier < winner.level) {
        console.log(`Current tier ${currentTier} and snapshot tier ${winner.level}`);
        if (!isFreeBuyTime) {
          return { maxBuy: 0, minBuy: 0 };
        }
      }
      // get user tier from winner table which snapshot user balance and pickup random winner
      console.log(`user tier is ${winner.level}`);
      // check user tier with min tier of campaign
      if (camp.min_tier > winner.level) {
        if (!isFreeBuyTime) {
          return { maxBuy: 0, minBuy: 0 };
        }
      }
      // call to db to get tier info
      const tier = await (new TierService()).findByLevelAndCampaign({ campaign_id, 'level': winner.level });
      if (!tier) {
        if (!isFreeBuyTime) {
          return { maxBuy: 0, minBuy: 0 };
        }
      } else {
        // check time start buy for tier
        console.log(`${tier.start_time} ${tier.end_time} ${current}`);
        if (!isFreeBuyTime) {
          if (!isInPreOrderTime) {
            if (tier.start_time > current) {
              return { maxBuy: 0, minBuy: 0 };
            }
            if (tier.end_time < current) {
              return { maxBuy: 0, minBuy: 0 };
            }
          }
        }
        // set min, max buy amount of user
        minBuy = tier.min_buy;
        maxBuy = tier.max_buy * winner.lottery_ticket;
      }
    }

    // FREE BUY TIME: Check if current time is free to buy or not
    if (isFreeBuyTime) {
      console.log('[CampaignController::deposit] - maxBuy-maxBonus:', maxBuy, maxBonus, !!existWhitelist);
      if (!!existWhitelist) {
        maxBuy = new BigNumber(maxBuy).plus(maxBonus).toNumber();
      }
    }
    console.log('Max-Min Token Amount: ', maxBuy, minBuy);

    return { maxBuy, minBuy };
  }

  async calculateEstimatePreOrderAmount(user, camp, amount) {
    const campaign_id = camp.id;
    const wallet_address = user.wallet_address;

    // Find User Max Buy in Pool
    const { maxBuy = 0, minBuy = 0 } = await this.caculateMaxMinBuyUser(user, camp);

    // Caculate Estimate Amount
    const preOrder = await this.findUserPreOrder(campaign_id, wallet_address);
    console.log('[PoolService::calculateEstimatePreOrderAmount] - preOrder:', JSON.stringify(preOrder));
    let preOrderAmount = (preOrder && preOrder.amount) || 0;
    let estimateAmount = amount;
    if (preOrder) {
      estimateAmount = new BigNumber(amount).plus(preOrderAmount).toFixed();
      if (new BigNumber(estimateAmount).gt(maxBuy)) {
        throw Error('You have reached your ' + maxBuy + ' individual cap');
      }
    }
    console.log('[preOrder] - estimateAmount: ', estimateAmount);

    return estimateAmount;
  }

  async calculateTotalAllowcationAmount(user, camp) {
    const maxBuy = await this.getAllocationAmount(user, camp);
    let preOrderAmount = await this.getAllocationPreOrderAmount(user, camp);
    const totalAllowcationAmount = new BigNumber(maxBuy || 0).plus(preOrderAmount).toFixed();
    console.log('[PoolService::calculateTotalAllowcationAmount] - Total Allowcation Amount: ', totalAllowcationAmount);
    return totalAllowcationAmount;
  }

  async getAllocationAmount(user, pool, currentUserTier) {
    if (!pool || !user) {
      return 0;
    }

    try {
      const walletAddress = user.wallet_address;
      const campaignId = pool.id;

      const isPublicWinner = (pool.public_winner_status == Const.PUBLIC_WINNER_STATUS.PUBLIC);
      if (!isPublicWinner) {
        return 0;
      }

      // FREE BUY TIME: Check if current time is free to buy or not
      const camp = await this.buildQueryBuilder({ id: campaignId }).with('freeBuyTimeSetting').first();
      const { maxBonus, isFreeBuyTime, existWhitelist } = await this.getFreeBuyTimeInfo(camp, walletAddress);
      let maxTotalBonus = 0;
      if (isFreeBuyTime && !!existWhitelist) {
        maxTotalBonus = maxBonus;
      }

      // Check user is in reserved list
      const reserve = await (new ReservedListService).buildQueryBuilder({
        wallet_address: walletAddress,
        campaign_id: campaignId,
      }).first();
      if (reserve) {
        return new BigNumber(reserve.max_buy).plus(maxTotalBonus).toFixed();
      }

      // Get Tier in smart contract
      const userTier = (await HelperUtils.getUserTierSmart(walletAddress))[0];
      const tierDb = await TierModel.query().where('campaign_id', campaignId).where('level', userTier).first();
      if (!tierDb) {
        return new BigNumber(maxTotalBonus).toFixed();
      }

      // get lottery ticket from winner list
      const winner = await WinnerModel.query().where('campaign_id', campaignId).where('wallet_address', walletAddress).first();
      if (!winner) {
        return new BigNumber(maxTotalBonus).toFixed();
      }

      const tier = await TierModel.query().where('campaign_id', campaignId).where('level', winner.level).first();
      if (!tier) {
        return 0;
      }

      return new BigNumber(
        new BigNumber(tier.max_buy).multipliedBy(winner.lottery_ticket)
      ).plus(maxTotalBonus).toFixed();
    } catch (e) {
      console.log('[getAllocationAmount]: ', e);
      return 0;
    }

    // const { maxBuy, minBuy } = await this.caculateMaxMinBuyUserWithCurrentUserTier(user, camp, currentUserTier);
    // return maxBuy || 0;
  }

  async getAllocationPreOrderAmount(user, camp, fetchFromRelation = false) {
    // With `fetchFromRelation`, need Eagle Load `preOrder` relationship
    // when fetch User data
    const campaign_id = camp.id;
    const wallet_address = user.wallet_address;

    // Caculate Pre-Order Amount
    if (fetchFromRelation) {
      let preOrders = camp.preOrders;
      if (preOrders && preOrders.length > 0) {
        let preOrder = preOrders[0];
        let preOrderAmount = (preOrder && preOrder.pivot && preOrder.pivot.amount) || 0;
        return preOrderAmount;
      }
    }

    let preOrder = await this.findUserPreOrder(campaign_id, wallet_address);
    if (!preOrder) return 0;

    preOrder = JSON.parse(JSON.stringify(preOrder));
    let preOrderAmount = (preOrder && preOrder.amount) || 0;
    return preOrderAmount;
  }

  async findUserPreOrder(campaign_id, wallet_address) {
    const preOrder = await (new UserPreOrderService()).buildQueryBuilder({ campaign_id, wallet_address }).first();
    return preOrder;
  }

  async convertMinMaxTokenAmount(camp, maxBuy) {
    // call to SC to get convert rate token erc20 -> our token
    // const receipt = await HelperUtils.getOfferCurrencyInfo(camp);
    // const rate = receipt[0];
    // const decimal = receipt[1];
    // const unit = receipt[2];
    // console.log(rate, decimal, unit);

    // Fix bug Buy token Exceeded Maximum Amount when send to Smart Contract
    //const maxBuyBuffer = new BigNumber(maxBuy).plus(1);

    // calc min, max token user can buy
    const maxTokenAmount = new BigNumber(maxBuy).multipliedBy(Math.pow(10, camp.decimals)).toFixed(0);
    const minTokenAmount = new BigNumber(0).toFixed(0);
    console.log(minTokenAmount, maxTokenAmount);

    return {
      minTokenAmount, maxTokenAmount
    }
  }
}

module.exports = PoolService;
