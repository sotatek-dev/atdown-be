'use strict'

const WhitelistSubmissionModel = use('App/Models/WhitelistSubmission');
const CampaignSocialRequirementModel = use('App/Models/CampaignSocialRequirement');
const ErrorFactory = use('App/Common/ErrorFactory');
const HelperUtils = use('App/Common/HelperUtils');
const requests = require('request');
const { URL } = require('url');
const Const = use('App/Common/Const');

const SOCIAL_NETWORK_TELEGRAM = 'telegram';
const SOCIAL_NETWORK_TWITTER = 'twitter';
const SOCIAL_NETWORK_CHECK_USER = 'user';
const SOCIAL_NETWORK_CHECK_POST = 'post';
const SOCIAL_CHECK_LINK = process.env.SOCIAL_CHECK_LINK || 'https://redkite-social-api.polkafoundry.com/api/v1/social-network/NETWORK/TYPE';

// import { TwitterApi } from 'twitter-api-v2';
const { TwitterApi } = require('twitter-api-v2');

class WhitelistSubmissionService {
  buildQueryBuilder(params) {
    // create query
    let builder = WhitelistSubmissionModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', params.wallet_address);
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }
    if (params.whitelist_user_id) {
      builder = builder.where('whitelist_user_id', params.whitelist_user_id);
    }
    if (params.list_wallet_address) {
      builder = builder.whereNotIn('wallet_address', params.list_wallet_address);
    }
    if (params.page && params.pageSize) {
      builder = builder.paginate(params.page, params.pageSize);
    }

    return builder;
  }
 
  async findListSubmission(params) {
    let builder = this.buildQueryBuilder(params);
    return await builder
  }

  async updateTierUser(walletAddress, campaign_id, tier) {
    console.log('data: ', walletAddress, campaign_id, tier);
    await WhitelistSubmissionModel
      .query()
      .where('wallet_address', '=', walletAddress)
      .andWhere('campaign_id', '=', campaign_id)
      .update({ tier: tier })
  }

  async findSubmission(params) {
    let builder = this.buildQueryBuilder(params);
    return await builder.first();
  }

  async addWhitelistSubmission(params) {
    console.log('[addWhitelistSubmission] - Params: ', params);
    if (!params.wallet_address || !params.campaign_id ) {
      ErrorFactory.badRequest('Missing required field')
    }

    let wl = await WhitelistSubmissionModel.query().
      where('campaign_id', params.campaign_id).
      where('wallet_address', params.wallet_address).first();
    // check submission if this submission is complete throw already joined if not delete old submission and update with new submission
    if (wl) {
      if (wl.whitelist_user_id) {
        ErrorFactory.badRequest('User already joined this campain');
      } else {
        await WhitelistSubmissionModel.query().
          where('campaign_id', params.campaign_id).
          where('wallet_address', params.wallet_address).delete()
      }
    }
    if(params.user_twitter&&params.user_telegram){
    wl = await WhitelistSubmissionModel.query()
      .where('campaign_id', params.campaign_id)
      .whereNotNull('whitelist_user_id')
      .where((query) => {
        query
          .where('user_twitter', params.user_twitter)
          .whereNotNull('user_twitter')
          .orWhere('user_telegram', params.user_telegram)
          .whereNotNull('user_telegram')
      }).first();
    if (wl) {
      ErrorFactory.badRequest('Duplicated telegram or twitter username');
    }
    }

    const whitelistSubmission = new WhitelistSubmissionModel;

    whitelistSubmission.fill({
      wallet_address: params.wallet_address,
      campaign_id: params.campaign_id,
      user_telegram: params.user_telegram,
      user_twitter: params.user_twitter,
      self_retweet_post_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      partner_retweet_post_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      tier: params.userTier
    });
    await whitelistSubmission.save();

    console.log('Res: ', whitelistSubmission);
    return whitelistSubmission;
  }

  async createWhitelistSubmissionAccount(params) {
    const whitelistSubmission = new WhitelistSubmissionModel;
    whitelistSubmission.fill(params);
    await whitelistSubmission.save();

    console.log('Res: ', whitelistSubmission);
    return whitelistSubmission;
  }

  async checkFullSubmission(campaign_id, wallet_address) {
    const submission = await WhitelistSubmissionModel.query().
      where('campaign_id', campaign_id).
      where('wallet_address', wallet_address).first();
    if (!submission) {
      ErrorFactory.internal('WhitelistSubbmission not found')
    }

    const requirement = await CampaignSocialRequirementModel.query().where('campaign_id', campaign_id).first()
    if (!requirement) {
      await this.approveSubmission(submission)
      return Array(8).fill(Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
    }

    return await Promise.all([
      this.checkSubmission(submission, requirement, 'self_twitter_status'),
      // this.checkSubmission(submission, requirement, 'self_group_status'),
      this.checkSubmission(submission, requirement, 'self_channel_status'),
      this.checkSubmission(submission, requirement, 'partner_twitter_status'),
      // this.checkSubmission(submission, requirement, 'partner_group_status'),
      this.checkSubmission(submission, requirement, 'partner_channel_status'),
    ]);
  }

  async checkPendingSubmission(campaign_id, wallet_address) {
    const submission = await WhitelistSubmissionModel.query().
      where('campaign_id', campaign_id).
      where('wallet_address', wallet_address).first();
    if (!submission) {
      ErrorFactory.internal('WhitelistSubbmission not found')
    }

    const requirement = await CampaignSocialRequirementModel.query().where('campaign_id', campaign_id).first()
    if (!requirement) {
      await this.approveSubmission(submission)
      return Array(8).fill(Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
    }

    return await Promise.all([
      submission.self_twitter_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'self_twitter_status'),
      // submission.self_group_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'self_group_status'),
      submission.self_channel_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'self_channel_status'),
      submission.partner_twitter_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'partner_twitter_status'),
      // submission.partner_group_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'partner_group_status'),
      submission.partner_channel_status === Const.SOCIAL_SUBMISSION_STATUS.COMPLETED ? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : this.checkSubmission(submission, requirement, 'partner_channel_status'),
    ]);
  }

  async approveSubmission(submission) {
    submission.merge({
      self_twitter_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      self_group_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      self_channel_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      self_retweet_post_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      partner_twitter_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      partner_group_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      partner_channel_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
      partner_retweet_post_status: Const.SOCIAL_SUBMISSION_STATUS.COMPLETED,
    });
    await submission.save();
  }

  async checkSubmission(submission, requirement, type) {
    let result = Const.SOCIAL_SUBMISSION_STATUS.PENDING

    switch (type) {
      case 'self_twitter_status':
        result = await this.checkFollowTwitter(submission.user_twitter, requirement.self_twitter, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.self_twitter_status) {
          submission.merge({ self_twitter_status: result });
          await submission.save();
        }
        return result;

      case 'self_group_status':
        result = await this.checkJoinTelegram(submission.user_telegram, requirement.self_group, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.self_group_status) {
          submission.merge({ self_group_status: result });
          await submission.save();

        }
        return result;

      case 'self_channel_status':
        result = await this.checkFollowTelegram(submission.user_telegram, requirement.self_channel, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.self_channel_status) {
          submission.merge({ self_channel_status: result });
          await submission.save();
        }
        return result;

      case 'partner_twitter_status':
        result = await this.checkFollowTwitter(submission.user_twitter, requirement.partner_twitter, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.partner_twitter_status) {
          submission.merge({ partner_twitter_status: result });
          await submission.save();
        }
        return result;

      case 'partner_group_status':
        result = await this.checkJoinTelegram(submission.user_telegram, requirement.partner_group, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.partner_group_status) {
          submission.merge({ partner_group_status: result });
          await submission.save();
        }
        return result;

      case 'partner_channel_status':
        result = await this.checkFollowTelegram(submission.user_telegram, requirement.partner_channel, Const.SOCIAL_SUBMISSION_STATUS.ERROR);
        if (result != submission.partner_channel_status) {
          submission.merge({ partner_channel_status: result });
          await submission.save();
        }
        return result;

      default:
        return Const.SOCIAL_SUBMISSION_STATUS.ERROR;
    }
  }

  async checkJoinTelegram(username, group, fallbackValue) {
    if (!group) {
      return Const.SOCIAL_SUBMISSION_STATUS.COMPLETED;
    }

    if (!username) {
      return Const.SOCIAL_SUBMISSION_STATUS.REJECTED;
    }

    const params = {
      username: username,
      group: group,
    }
    return await this.checkSocial(SOCIAL_NETWORK_TELEGRAM, SOCIAL_NETWORK_CHECK_USER, params, fallbackValue);
  }

  async checkFollowTelegram(username, group, fallbackValue) {
    if (!group) {
      return Const.SOCIAL_SUBMISSION_STATUS.COMPLETED;
    }

    if (!username) {
      return Const.SOCIAL_SUBMISSION_STATUS.REJECTED;
    }

    const params = {
      username: username,
      group: group,
    }
    return await this.checkSocial(SOCIAL_NETWORK_TELEGRAM, SOCIAL_NETWORK_CHECK_USER, params, fallbackValue);
  }

  async checkFollowTwitter(username, group, fallbackValue) {
    if (!group) {
      return Const.SOCIAL_SUBMISSION_STATUS.COMPLETED;
    }

    if (!username) {
      return Const.SOCIAL_SUBMISSION_STATUS.REJECTED;
    }

    const params = {
      username: username,
      group: group,
    }
    return await this.checkSocial(SOCIAL_NETWORK_TWITTER, SOCIAL_NETWORK_CHECK_USER, params, fallbackValue);
  }
  
  async checkSocial(network, type, params, fallbackValue) {
    try {
      // const url = SOCIAL_CHECK_LINK.replace('NETWORK', network).replace('TYPE', type)
      // const options = {
      //   url: url,
      //   method: 'GET',
      //   qs: params,
      // }

      // const response = await new Promise((resolve, reject) => {
      //   requests(options, function (error, response, body) {
      //     if (error) reject(error)
      //     else resolve(response)
      //   })
      // })
      if(network==SOCIAL_NETWORK_TWITTER){
      // const twitterClient = new TwitterApi(TWITTER_ACCESS_TOKEN,TWITTER_ACCESS_SECRET,TWITTER_APP_KEY,TWITTER_APP_SECRET);
      const twitterClient = new TwitterApi({
        accessToken: '1397082164894715904-2fdGw2WH5VD8X9CYSNF6CnFE1CbjUa',
        accessSecret: 'kMDO3L804HHkv0l5pn1Sz1UNkwelz4xn1pSDqJRbIU2Xa',
        appKey: 'Mgabyp0yvycMO7BfSnWIHUC3e', // consumer key
        appSecret: 'JHlBgJFw1fBvhXzj4EVnkS9SJJ0vuxzYZYVd0rSc5oPWHHvRu8', // consumer secret
      })
      const roClient = twitterClient.readOnly;
      // const userId = await roClient.v2.userByUsername(params.username);
      // if(!userId){
      //   return Const.SOCIAL_SUBMISSION_STATUS.ERROR
      // }
      const check = await roClient.v1.friendship({source_screen_name:params.username,target_screen_name:params.group});
      if(!check.relationship.target.followed_by){
        return Const.SOCIAL_SUBMISSION_STATUS.ERROR
      }
      // const res =followers.data.find(element=> element.username==params.group);
      // if(!res){
      //   return Const.SOCIAL_SUBMISSION_STATUS.ERROR
      // }
      return check.relationship.target.followed_by? Const.SOCIAL_SUBMISSION_STATUS.COMPLETED : fallbackValue
    };

    if(network==SOCIAL_NETWORK_TELEGRAM){
      return Const.SOCIAL_SUBMISSION_STATUS.COMPLETED
    };  
    } 
    catch (e) {
      return Const.SOCIAL_SUBMISSION_STATUS.ERROR
    }
  }

  async countByCampaignId(campaign_id) {
    return await WhitelistSubmissionModel.query().
      where('campaign_id', campaign_id).getCount();
  }
}

module.exports = WhitelistSubmissionService;
