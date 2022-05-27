'use strict'

const TierService = use('App/Services/TierService');
const CampaignService = use('App/Services/CampaignService');
const UserService = use('App/Services/UserService');
const WhitelistSubmissionModel = use('App/Models/WhitelistSubmission');
const cachedUserModel = use('App/Models/CachedUser');
const CampaignSocialRequirement = use('App/Models/CampaignSocialRequirement');
const WhitelistSubmissionService = use('App/Services/WhitelistSubmissionService');
const BadRequestException = use('App/Exceptions/BadRequestException');
const ConvertDateUtils = use('App/Common/ConvertDateUtils');
const HelperUtils = use('App/Common/HelperUtils');
const Const = use('App/Common/Const');
const CountryList = use('App/Common/Country');
const Database = use('Database')
const WhitelistService = use('App/Services/WhitelistUserService')
const CanceledApplyWhitelistService = use('App/Services/CanceledApplyWhitelistService');


class WhiteListSubmissionController {

  async getWhitelistSubmission({ request, params }) {
    const campaign_id = params.campaignId;
    const wallet_address = request.input('wallet_address');

    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }
    if (!wallet_address) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();
      const submissionParams = {
        wallet_address,
        campaign_id,
      }
      const submission = await whitelistSubmissionService.findSubmission(submissionParams)
      return HelperUtils.responseSuccess(
        submission
      );

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }

  async getPreviousWhitelistSubmission({ request, params }) {
    const wallet_address = request.input('wallet_address');

    if (!wallet_address) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();
      const submissionParams = {
        wallet_address,
      }
      const submission = await whitelistSubmissionService.findSubmission(submissionParams)
      return HelperUtils.responseSuccess(
        submission
      );

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }

  async getRemainParticipants({ request }) {
    const campaign_id = request.params.campaignId;
    const page = request.input('page');
    const pageSize = request.input('limit') ? request.input('limit') : 10;
    const whitelistPending = request.input('whitelist_pending') || 'false';
    const whitelistService = new WhitelistService();
    const loteriedList = await whitelistService.getLoteriedList(campaign_id);

    try {
      // const whitelistSubmissionService =new WhitelistSubmissionService()
      let query = WhitelistSubmissionModel.query()
        .leftOuterJoin('cached_users', (query) => {
          query
            .on('cached_users.wallet_address', '=', 'whitelist_submissions.wallet_address')
        })
        .select('whitelist_submissions.*')
        .select('cached_users.email', 'cached_users.tier as level')
        .where('whitelist_submissions.campaign_id', campaign_id)
        .whereNotIn('whitelist_submissions.wallet_address ', loteriedList);

      if (whitelistPending === 'true') {
        query = query
          .where((q) => {
            q.where('whitelist_submissions.self_twitter_status', '!=', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('whitelist_submissions.self_channel_status', '!=', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('whitelist_submissions.partner_twitter_status', '!=', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
              .orWhere('whitelist_submissions.partner_channel_status', '!=', Const.SOCIAL_SUBMISSION_STATUS.COMPLETED)
          })
      }

      const submission = await query.paginate(page, pageSize);
      // .fetch();

      // const  submission = await whitelistSubmissionService.findListSubmission(submissionParams)
      return HelperUtils.responseSuccess(submission)
    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Participants fail !');
      }
    }
  }



  async addWhitelistSubmission({ request, params }) {
    // get request params
    const campaign_id = params.campaignId;
    const wallet_address = request.input('wallet_address');
    const requireSocial = await CampaignSocialRequirement.query().where('campaign_id', campaign_id).fetch();
    // console.log(requireSocial)
    let user_telegram, user_twitter;
    if (requireSocial.rows.length) {
      // if (!request.input('user_telegram') || !request.input('user_twitter')) return HelperUtils.responseBadRequest('Missing user_telegram or user_twitter field')
      if (request.input('user_telegram') != null) {
        user_telegram = request.input('user_telegram').trim().toLowerCase();
      }
      if (request.input('user_twitter') != null) {
        user_twitter = request.input('user_twitter').trim().toLowerCase();
      }
      const regex = new RegExp('^@?[a-zA-Z0-9._]+$');
      if (!regex.test(user_telegram) || !regex.test(user_twitter)) {
        return HelperUtils.responseBadRequest('Invalid character detected. Please only submit your username.');
      }
    }

    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }

    console.log('Submit social submission for campain with params: ', campaign_id, wallet_address);
    try {
      // check campaign
      const campaignService = new CampaignService();
      const camp = await campaignService.findByCampaignId(campaign_id);
      if (!camp) {
        return HelperUtils.responseBadRequest(`Bad request with campaignId ${campaign_id}`)
      }
      // if (!camp || camp.buy_type !== Const.BUY_TYPE.WHITELIST_LOTTERY) {
      //   console.log(`Campaign with id ${campaign_id}`)
      //   return HelperUtils.responseBadRequest(`Bad request with campaignId ${campaign_id}`)
      // }
      const currentDate = ConvertDateUtils.getDatetimeNowUTC();
      console.log(`Join with date ${currentDate}`);
      // check time to join campaign
      if (camp.start_join_pool_time > currentDate || camp.end_join_pool_time < currentDate) {
        console.log(`It's not right time to join campaign ${currentDate} ${camp.start_join_pool_time} ${camp.end_join_pool_time}`)
        return HelperUtils.responseBadRequest("It's not right time to join this campaign !");
      }
      // get user info
      const userService = new UserService();
      const userParams = {
        'wallet_address': wallet_address
      }
      // if(camp.kyc_bypass===0){
      const user = await userService.findUser(userParams);
      if (!user || !user.email) {
        console.log(`User ${user}`);
        return HelperUtils.responseBadRequest("You're not valid user to join this campaign !");
      }
      if (user.is_kyc != Const.KYC_STATUS.APPROVED) {
        console.log('User does not KYC yet !');
        return HelperUtils.responseBadRequest("You must register for KYC successfully to be allowed to join. Or the email address and/or wallet address you used for KYC does not match the one you use on Red Kite. Please check and update on Blockpass to complete KYC verification.");
      }

      const canceledApplyWhitelist = new CanceledApplyWhitelistService();
      const is_Cancel = await canceledApplyWhitelist.findCanceledApplyWhitelist({ wallet_address: wallet_address, campaign_id: campaign_id });
      if (is_Cancel) {
        return HelperUtils.responseBadRequest("You have registered this campain whitelist but you have unjoined this campain.");
      }
      // }
      // let forbidden_countries = [];
      // try {
      //   forbidden_countries = JSON.parse(camp.forbidden_countries);
      // } catch (_) {
      //   forbidden_countries = [];
      // }
      // if (forbidden_countries.includes(user.national_id_issuing_country)) {
      //   return HelperUtils.responseBadRequest(`Sorry, citizens and residents of ${CountryList && CountryList[user.national_id_issuing_country] || user.national_id_issuing_country} are restricted to participate in the IDO.`);
      // }


      // check user tier

      // let userTier=0;


      //  const userTier = (await HelperUtils.getUserTierSmart(wallet_address))[0];
      const cachedUser = await cachedUserModel.query().select('*').where('wallet_address', '=', wallet_address).first();
      console.log('cachedUser: ', cachedUser);
      const userTier = cachedUser.tier;
      console.log('userTier: ', userTier);
      const whitelistSubmissionService = new WhitelistSubmissionService();

      // check user tier with min tier of campaign
      if (camp.min_tier > userTier) {
        return HelperUtils.responseBadRequest("You're not tier qualified for join this campaign!");
      }
      // call to db to get tier info
      // const tierService = new TierService();
      // const tierParams = {
      //   'campaign_id': campaign_id,
      //   'level': userTier
      // };
      // const tier = await tierService.findByLevelAndCampaign(tierParams);
      // if (!tier) {
      //   return HelperUtils.responseBadRequest("You're not tier qualified for join this campaign!");
      // }

      // call to whitelist submission service
      const submissionParams = {
        wallet_address,
        campaign_id,
        user_telegram,
        user_twitter,
        userTier
      }
      await whitelistSubmissionService.addWhitelistSubmission(submissionParams)

      const socialCheckResult = await whitelistSubmissionService.checkFullSubmission(campaign_id, wallet_address);
      const rejected = socialCheckResult.includes(Const.SOCIAL_SUBMISSION_STATUS.REJECTED);
      const error = socialCheckResult.includes(Const.SOCIAL_SUBMISSION_STATUS.ERROR);
      const submission = await WhitelistSubmissionModel.query().
        where('campaign_id', campaign_id).
        where('wallet_address', wallet_address).first();
      if (!error) {
        await campaignService.joinCampaign(campaign_id, wallet_address, user.email, userTier);
      }

      return {
        status: 200,
        message: rejected ? 'Please follow our instruction correctly' : 'Success',
        data: submission,
        rejected: rejected
      }
    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Submit Whitelist fail !');
      }
    }
  }

  async updateWhitelistSubmission({ request, params }) {
    const campaign_id = params.campaignId;
    const wallet_address = params.walletAddress;

    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }
    if (!wallet_address) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();
      const submissionParams = {
        wallet_address,
        campaign_id,
      }
      const submission = await whitelistSubmissionService.findSubmission(submissionParams)
      const data = request.post();
      submission.merge({
        self_twitter_status: data.self_twitter_status,
        self_group_status: data.self_group_status,
        self_channel_status: data.self_channel_status,
        self_retweet_post_status: data.self_retweet_post_status,
        partner_twitter_status: data.partner_twitter_status,
        partner_group_status: data.partner_group_status,
        partner_channel_status: data.partner_channel_status,
        partner_retweet_post_status: data.partner_retweet_post_status,
      });

      await submission.save();

      return HelperUtils.responseSuccess();

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }

  async verifyWhitelistSubmission({ request, params }) {
    const campaign_id = params.campaignId;
    const wallet_address = params.walletAddress;

    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }
    if (!wallet_address) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();

      const socialCheckResult = await whitelistSubmissionService.checkPendingSubmission(campaign_id, wallet_address);
      return HelperUtils.responseSuccess(socialCheckResult);

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }

  async verifyBatchWhitelistSubmission({ request, params }) {
    const campaign_id = params.campaignId;
    const inputParams = request.only(['wallet_addresses', 'campaign_id']);
    // const walletAddresses = inputParams.walletAddresses
    const campaignService = new CampaignService();
    const userService = new UserService();
    console.log('inputParams: ', inputParams)
    console.log('campaign_id: ', campaign_id)

    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }
    if (!inputParams.wallet_addresses || !inputParams.wallet_addresses.length) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();

      for (const wallet_address of inputParams.wallet_addresses) {

        const checkPending = await whitelistSubmissionService.checkPendingSubmission(campaign_id, wallet_address);


        const error = checkPending.includes(Const.SOCIAL_SUBMISSION_STATUS.ERROR)

        const user = await userService.findUser(wallet_address);
        // const userTier = (await HelperUtils.getUserTierSmart(wallet_address))[0];

        const submission = await whitelistSubmissionService.findSubmission({ wallet_address, campaign_id });
        console.log('submission: ', submission)
        const userTier = submission.tier;
        if (userTier > 3 && !error) {
          await campaignService.joinCampaign(campaign_id, wallet_address, user.email, userTier);
        }
      }
      return HelperUtils.responseSuccess();

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }

  async approveBatchWhitelistSubmission({ request, params }) {
    const campaign_id = params.campaignId;
    const inputParams = request.only(['wallet_addresses', 'campaign_id']);
    const campaignService = new CampaignService();
    const userService = new UserService();
    if (!campaign_id) {
      return HelperUtils.responseBadRequest('Bad request with campaign_id');
    }
    if (!inputParams.wallet_addresses || !inputParams.wallet_addresses.length) {
      return HelperUtils.responseBadRequest('Bad request with wallet_address');
    }

    try {
      const whitelistSubmissionService = new WhitelistSubmissionService();

      for (const wallet_address of inputParams.wallet_addresses) {
        const submissionParams = {
          wallet_address,
          campaign_id,
        }

        const submission = await whitelistSubmissionService.findSubmission(submissionParams)
        if (!submission) {
          continue;
        }

        await whitelistSubmissionService.approveSubmission(submission)
        const userTier = submission.tier;
        const user = await userService.findUser(wallet_address);

        if (userTier > 3) {
          await campaignService.joinCampaign(campaign_id, wallet_address, user.email, userTier);
        }
      }
      return HelperUtils.responseSuccess();

    } catch (e) {
      console.log("error", e)
      if (e instanceof BadRequestException) {
        return HelperUtils.responseBadRequest(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR : Get Whitelist Submission fail !');
      }
    }
  }
}

module.exports = WhiteListSubmissionController