'use strict'

const WhitelistModel = use('App/Models/WhitelistUser');
const WhitelistSubmissionModel = use('App/Models/WhitelistSubmission');
const Const = use('App/Common/Const');
const Database = use('Database')

class WhitelistUserService {
  buildQueryBuilder(params) {
    // create query
    let builder = WhitelistModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.email) {
      builder = builder.where('email', params.email);
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', params.wallet_address);
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }

    // For search box
    if (params.search_term) {
      builder = builder.where(query => {
        query.where('wallet_address', 'like', '%' + params.search_term + '%')
          .orWhere('email', 'like', '%' + params.search_term + '%');
      })
    }

    return builder;
  }

  buildSearchQuery(params) {
    let builder = WhitelistModel.query();
    if (params.email) {
      builder = builder.where('email', 'like', '%' + params.email + '%');
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', 'like', '%' + params.wallet_address + '%')
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }
    return builder;
  }

  async findWhitelistUser(params) {
    let builder = this.buildQueryBuilder(params).with('whitelistSubmission');
    // filter only users who completed every whitelist step
    if (params && params.whitelist_completed) {
      builder = this.buildQueryBuilder(params)
        .with('whitelistSubmission')
        .whereHas('whitelistSubmission', (query) => {
          query.where('self_twitter_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('self_group_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('self_channel_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('self_retweet_post_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('partner_twitter_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('partner_group_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('partner_channel_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
            .andWhere('partner_retweet_post_status', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
        });
    }

    if (params && params.whitelist_pending) {
      console.log('asdhjkgsakdhfgkjhsadgfjkhasdfgksahjdfgajskhdgfjhkasdgfjkhasdgfjkahsgdfkjhasdgjkh', params.whitelist_pending)
      builder = this.buildQueryBuilder(params)
        .with('whitelistSubmission')
        .whereHas('whitelistSubmission', (query) => {
          query.where((query) => {
            query.where('self_twitter_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('self_group_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('self_channel_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('self_retweet_post_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('partner_twitter_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('partner_group_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('partner_channel_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('partner_retweet_post_status', '<>', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
          })
        });
    }
    if (params.page && params.pageSize) {
      // pagination
      return await builder.paginate(params.page, params.pageSize);
    }
    // return all result
    return await builder.fetch();
  }

  async countByCampaignId(campaign_id) {
    // return await WhitelistModel.query().
    //   where('campaign_id', campaign_id).getCount();
      const submission = await WhitelistSubmissionModel.query()
      .leftOuterJoin('cached_users', (query) => {
        query
          .on('cached_users.wallet_address', '=', 'whitelist_submissions.wallet_address')
      })
      .select('whitelist_submissions.*')
      .select('cached_users.email', 'cached_users.tier as level')
      .where('whitelist_submissions.campaign_id', campaign_id)
      .whereNotIn('whitelist_submissions.wallet_address', loteriedList)
      return  
  }

  async checkExisted(wallet_address, campaign_id) {
    const wl = await WhitelistModel.query().
      where('campaign_id', campaign_id).
      where('wallet_address', wallet_address).first();
    return wl != null ? true : false;
  }

  async getRandomWinners(number, campaign_id) {
    return await WhitelistModel.query()
      .where('campaign_id', campaign_id)
      .orderByRaw('RAND()').limit(number).fetch();
  }
  async getLoteriedList(campaign_id){
    // get winner
    const winnerData= await Database
      .from('winner_list')
      .select('wallet_address')
      .where('campaign_id',campaign_id)
    //get reserved list
    const reservedData= await Database
      .from('reserved_list')
      .select('wallet_address')
      .where('campaign_id',campaign_id)
      
    const results=JSON.parse(JSON.stringify(winnerData)).concat(JSON.parse(JSON.stringify(reservedData)))
    return results.map(e=>e.wallet_address)
  }

  async getRandomWinnersUnique(number, campaign_id) {
    // TODO: Please Use getRandomWinnersUnique
    return await WhitelistModel.query()
      .where('campaign_id', campaign_id)
      .orderByRaw('RAND()').limit(number)
      .fetch();
  }

  async search(params) {
    let builder = this.buildSearchQuery(params);
    if (params.page && params.pageSize) {
      // pagination
      return await builder.paginate(params.page, params.pageSize);
    }
    // return all result
    return await builder.fetch();
  }

  async addWhitelistUser(params) {
    console.log('[addWhitelistUser] - Params: ', params);
    const whitelist = new WhitelistModel;
    whitelist.wallet_address = params.wallet_address;
    whitelist.campaign_id = params.campaign_id;
    whitelist.email = params.email;
    await whitelist.save();

    console.log('Res: ', whitelist);
    return whitelist;
  }

  async addSubmitToWhitelist (campaign_id) {
    console.log('campaign_id: ',campaign_id)
    let listWhitelist = (await WhitelistModel.query()
      .where('campaign_id', campaign_id)
      .fetch()).toJSON();  

    console.log('listWhitelist: ', listWhitelist) 
    listWhitelist =listWhitelist.map(e=>e.wallet_address)
    // console.log('listSubmission: ', listWhitelist) 
    const listSubmission = (await WhitelistSubmissionModel.query()
    .where('campaign_id', campaign_id)
    .whereNotIn('wallet_address',listWhitelist)
    .fetch()).toJSON();

    console.log('listSubmission: ', listWhitelist) 

    var data=[]
    for(let i = 0; i < listSubmission.length; i++) {
      data.push({wallet_address:listSubmission[i].wallet_address,campaign_id:listSubmission[i].campaign_id})
    }
    
    WhitelistModel.createMany(data)
  } 
}

module.exports = WhitelistUserService
