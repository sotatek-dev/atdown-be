'use strict'

const requests = require("request");
const BigNumber = use('bignumber.js');
const randomString = use('random-string');

const Const = use('App/Common/Const');
const Env = use('Env');
const Hash = use('Hash');
const Event = use('Event')
const Database = use('Database');
const ErrorFactory = use('App/Common/ErrorFactory');

const PoolService = use('App/Services/PoolService');
const WhitelistService = use('App/Services/WhitelistUserService');
const WhitelistSubmissionService = use('App/Services/WhitelistSubmissionService');
const UserService = use('App/Services/UserService');
const CampaignService = use('App/Services/CampaignService');
const WinnerListService = use('App/Services/WinnerListUserService');

const TierService = use('App/Services/TierService');
const ReservedListService = use('App/Services/ReservedListService');

const UserModel = use('App/Models/User');
const CachedUserModel = use('App/Models/CachedUser');
const TierModel = use('App/Models/Tier');
const ConfigModel = use('App/Models/Config');
const BlockpassApprovedModel = use('App/Models/BlockPassApproved');
const WinnerModel = use('App/Models/WinnerListUser');
const PasswordResetModel = use('App/Models/PasswordReset');
const BlockPassModel = use('App/Models/BlockPass');
const CampaignModel = use('App/Models/Campaign');

const HelperUtils = use('App/Common/HelperUtils');
const RedisUtils = use('App/Common/RedisUtils');
const SendForgotPasswordJob = use('App/Jobs/SendForgotPasswordJob');
const CachingUserDataJob = use('App/Jobs/CachingUserDataJob');
const ConvertDateUtils = use('App/Common/ConvertDateUtils');

class UserController {
  async reloadCachedUserData({ request }) {
    CachingUserDataJob.doDispatch(null);
    return HelperUtils.responseSuccess();
  }

  async userList({ request }) {
    try {
      const params = request.only(['limit', 'page']);
      const limit = params.limit || Const.DEFAULT_LIMIT;
      const page = params.page || 1;

      const walletAddress = request.input('walletAddress');
      const tier = request.input('tier');

      let cachedUserQuery = CachedUserModel
        .query()
        .where((q) => {
          if (walletAddress) q.where('wallet_address', 'like', `%${walletAddress}%`)
          if (tier) q.where('tier', '=', tier)
        })
        .orderBy('updated_at', 'DESC')

      const userList = (await cachedUserQuery.paginate(page, limit)).toJSON()

      return HelperUtils.responseSuccess(userList);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: get user list fail !');
    }
  }

  async tierInfo({ request }) {
    try {
      const params = request.all();
      const wallet_address = params.wallet_address;

      if (await RedisUtils.checkExistRedisUserTierBalance(wallet_address)) {
        const cached = JSON.parse(await RedisUtils.getRedisUserTierBalance(wallet_address));
        const tierCacheTimeToLive = 5 * 60 * 1000 // 5 minutes

        if ((new Date()).getTime() - cached.updatedAt < tierCacheTimeToLive) {
          return HelperUtils.responseSuccess({
            tier: cached.data[0],
            stakedInfo: cached.data[3],
          });
        }
      }

      const tierInfo = await HelperUtils.getUserTierSmart(wallet_address);
      console.log(tierInfo)
      RedisUtils.createRedisUserTierBalance(wallet_address, tierInfo);

      return HelperUtils.responseSuccess({
        tier: tierInfo[0],
        stakedInfo: tierInfo[3],
      });
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async profile({ request }) {
    try {
      const params = request.all();
      const wallet_address = params.wallet_address;
      const findedUser = await UserModel.query().where('wallet_address', wallet_address).first();
      if (!findedUser) {
        return HelperUtils.responseNotFound();
      }
      // const whitelistSubmission = JSON.parse(JSON.stringify(
      //   await (new WhitelistSubmissionService).findSubmission({ wallet_address })
      // ));

      return HelperUtils.responseSuccess({
        user: {
          email: findedUser.email,
          id: findedUser.id,
          status: findedUser.status,
          is_kyc: findedUser.is_kyc,
          user_twitter: findedUser.user_twitter,
          user_telegram: findedUser.user_telegram,
        }
      });
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async updateProfile({ request, auth }) {
    try {
      const userService = new UserService();
      const params = request.only(['user_twitter', 'user_telegram']);
      const wallet_address = request.header('wallet_address');
      const user = await userService.buildQueryBuilder({ wallet_address }).first();
      if (!user) {
        return HelperUtils.responseNotFound('User Not Found');
      }

      // const whitelistSubmission = JSON.parse(JSON.stringify(
      //   await (new WhitelistSubmissionService).findSubmission({ wallet_address })
      // ));
      // console.log('whitelistSubmission', whitelistSubmission);

      // if (whitelistSubmission) {
      //   console.log('[UserController::updateProfile] - Update whitelistSubmissions with param:', user.id, wallet_address, params);
      //   await (new WhitelistSubmissionService).buildQueryBuilder({ wallet_address }).update(params);
      // } else {
      //   console.log('[UserController::updateProfile] - Create whitelistSubmissions with param:', user.id, wallet_address, params);
      //   await (new WhitelistSubmissionService).createWhitelistSubmissionAccount({
      //     ...params,
      //     wallet_address,
      //   });
      // }

      await userService.buildQueryBuilder({ wallet_address }).update(params);

      return HelperUtils.responseSuccess({
        user: {
          ...params,
          id: user.id,
          wallet_address: user.wallet_address,
          // user: await userService.findUser({ wallet_address }),
        }
      }, 'Update Success');
    } catch (e) {
      console.log(e);
      return ErrorFactory.internal('ERROR: Update profile fail!');
    }
  }

  async uploadAvatar({ request }) {
    const validationOptions = {
      types: ['image'],
      size: Const.FILE_SITE,
      extnames: Const.FILE_EXT
    };

    const profilePic = request.file('avatar', validationOptions);
    const timeStamp = Date.now();
    const fileName = timeStamp + '_' + (profilePic.clientName || '').replace(/\s/g, '_');
    await profilePic.move(Helpers.tmpPath('uploads'), {
      name: fileName,
      overwrite: true
    });
    if (!profilePic.moved()) {
      return profilePic.error()
    }

    return HelperUtils.responseSuccess({ fileName });
  }

  async forgotPassword({ request }) {
    try {
      const params = request.all();
      const role = request.params.type == Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER;
      const userService = new UserService();
      const user = await userService.findUser({
        email: params.email,
        wallet_address: params.wallet_address,
        role,
      });
      if (!user) {
        console.error('user not found.')
        return HelperUtils.responseSuccess();
      }
      const token = await userService.resetPasswordEmail(params.email, role);
      const mailData = {};
      mailData.username = user.username;
      mailData.email = user.email;
      mailData.token = token;

      const isAdmin = request.params.type === Const.USER_TYPE_PREFIX.ICO_OWNER;
      const baseUrl = isAdmin ? Env.get('FRONTEND_ADMIN_APP_URL') : Env.get('FRONTEND_USER_APP_URL');
      mailData.url = baseUrl + '/#/reset-password/' + (isAdmin ? 'user/' : 'investor/') + token;

      SendForgotPasswordJob.doDispatch(mailData);

      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async checkToken({ request }) {
    try {
      const token = request.params.token;
      const role = request.params.type == Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER;
      const userService = new UserService();
      const checkToken = await userService.checkToken(token, role);
      return HelperUtils.responseSuccess({
        data: checkToken,
        status: 200,
      });
    } catch (e) {
      console.log('ERROR: ', e);
      if (e.status === 400) {
        return HelperUtils.responseNotFound(e.message);
      } else {
        return HelperUtils.responseErrorInternal();
      }
    }
  }

  async resetPassword({ request, auth }) {
    try {
      const params = request.all();
      const wallet_address = params.wallet_address;
      const token = request.params.token;
      const role = request.params.type == Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER;
      const userService = new UserService();
      const checkToken = await userService.checkToken(token, role);

      if (checkToken) {
        const token = randomString({ length: 40 });
        const user = await (new UserService()).findUser({
          email: checkToken.email,
          wallet_address: wallet_address,
          role
        });
        if (user) {
          user.password = params.password;
          user.token_jwt = token;
          await user.save();
          const tokenPassword = await PasswordResetModel.query()
            .where('email', checkToken.email)
            .where('role', role)
            .delete();

          return HelperUtils.responseSuccess()
        } else {
          return ErrorFactory.badRequest('Reset password failed!')
        }
      }

    } catch (e) {
      console.log('ERROR: ', e);
      if (e.status === 400) {
        return HelperUtils.responseBadRequest(e.message);
      } else if (e.status === 404) {
        return HelperUtils.responseNotFound(e.message);
      } else {
        return HelperUtils.responseErrorInternal('Server Error: Reset password fail');
      }
    }
  }

  async changePassword({ request, auth }) {
    const param = request.all();
    const passwordOld = param.password_old;
    const passwordNew = param.password_new;
    const role = request.params.type == Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER;
    const user = auth.user;

    if (await Hash.verify(passwordOld, user.password)) {
      const token = randomString({ length: 40 });
      const userService = new UserService();
      const userFind = await userService.findUser({
        email: user.email,
        role,
      });
      userFind.password = passwordNew;
      userFind.token_jwt = token;
      await userFind.save();
      return HelperUtils.responseSuccess(userFind, 'Change password successfully!');
    } else {
      return HelperUtils.responseErrorInternal('Old password does not match current password.');
    }
  }

  async confirmEmail({ request }) {
    try {
      const token = request.params.token;
      const userService = new UserService();
      const checkToken = await userService.confirmEmail(token);
      if (!checkToken) {
        return HelperUtils.responseErrorInternal('Active account link has expried.');
      }
      return HelperUtils.responseSuccess(checkToken);
    } catch (e) {
      console.log('ERROR: ', e);
      if (e.status === 400) {
        return HelperUtils.responseNotFound(e.message);
      } else {
        return HelperUtils.responseErrorInternal('ERROR: Confirm email fail !');
      }
    }
  }

  async changeType({ request }) {
    try {
      const param = request.all();
      if (param.basic_token != process.env.JWT_BASIC_AUTH) {
        return ErrorFactory.unauthorizedInputException('Basic token error!', '401');
      }
      if (param.type == Const.USER_TYPE.WHITELISTED) {
        Event.fire('new:createWhitelist', param)
      }
      const type = param.type == Const.USER_TYPE.WHITELISTED ? Const.USER_TYPE.WHITELISTED : Const.USER_TYPE.REGULAR
      const findUser = await UserModel.query()
        .where('email', param.email)
        .where('role', Const.USER_ROLE.PUBLIC_USER)
        .first();
      if (!findUser) {
        return HelperUtils.responseSuccess()
      }
      const token = randomString({ length: 40 });
      findUser.type = type
      findUser.token_jwt = token
      await findUser.save();
      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Change user type fail !');
    }
  }

  async checkEmailVerified({ request }) {
    try {
      const inputParams = request.only(['email']);
      const findUser = await UserModel.query()
        .where('email', inputParams.email)
        .where('status', Const.USER_STATUS.ACTIVE)
        .first();
      if (!findUser) {
        return HelperUtils.responseNotFound('User is unverified !')
      }
      return HelperUtils.responseSuccess('User is verified !');
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Check email verify fail !');
    }
  }

  async checkUserActive({ request }) {
    try {
      const params = request.all();
      console.log(`Check user active with params ${params}`);
      const userService = new UserService();
      // get user active by wallet_address
      const user = userService.findUser({ 'wallet_address': params.wallet_address });
      // check exist user or not and return result
      return HelperUtils.responseSuccess(user == null);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async getCurrentTier({ request, params }) {
    try {

      const { walletAddress, campaignId } = params;
      const filterParams = {
        wallet_address: walletAddress,
        campaign_id: campaignId,
      };

      console.log('[getCurrentTier] - filterParams: ', filterParams);

      // Check Public Winner Status
      const poolService = new PoolService;
      const poolExist = await poolService.getPoolById(campaignId);
      console.log('[getCurrentTier] - poolExist.public_winner_status:', poolExist && poolExist.public_winner_status);

      if (!poolExist) {
        return HelperUtils.responseSuccess({
          min_buy: 0,
          max_buy: 0,
          max_alocation: 0,
          start_time: 0,
          end_time: 0,
          tokenRemain: 0,
          level: 0,
        });
      }
      let userTier = 0;
      if (await RedisUtils.checkExistRedisUserTierBalance(walletAddress)) {
        const cached = JSON.parse(await RedisUtils.getRedisUserTierBalance(walletAddress));
        const tierCacheTimeToLive = 5 * 60 * 1000 // 5 minutes

        if ((new Date()).getTime() - cached.updatedAt < tierCacheTimeToLive) {
          userTier = cached.data[0];
        } else {
          userTier = (await HelperUtils.getUserTierSmart(walletAddress))[0];
        }
      } else {
        userTier = (await HelperUtils.getUserTierSmart(walletAddress))[0];
      }
      // const is_Winner = await (new WinnerListService()).findOneByFilters(filterParams);
      // const is_Reserved = await(new ReservedListService()).findOneByFilter(filterParams);    

      // if(is_Winner){ 
      //   userTier=is_Winner?.level||0
      // } 
      // else if(is_Reserved){
      //   userTier=is_Reserved?.level||0
      // }
      // else { 
      //   console.log("your hasnt register to this campain whiterlist ")
      //   userTier=0
      // }

      // const tierDb = await TierModel.query().where('campaign_id', campaignId).where('level', userTier).first();
      const camp = (await CampaignModel.query().where('id', campaignId).fetch()).toJSON();

      //check campain is swap time and deployed or not 
      const current = ConvertDateUtils.getDatetimeNowUTC();

      if (!camp[0].is_deploy) {
        console.log('this campain is not confirm winlist and deploy yet')

        return HelperUtils.responseSuccess({
          min_buy: 0,
          max_buy: 0,
          max_alocation: 0,
          start_time: camp[0].start_time || 0,
          end_time: camp[0].finish_time || 0,
          tokenRemain: camp[0].total_sold_coin,
          level: userTier,
        });
      }
      const contract = await HelperUtils.getContractInstance(camp[0]);
      // let userPurchasedAmount = await contract.methods.userPurchased(walletAddress).call();
      // userPurchasedAmount = new BigNumber(userPurchasedAmount).div(Math.pow(10, camp[0].decimals || 0)).toFixed();
      const campaignService = new CampaignService()

      var maxAllocation = await campaignService.getUserMaxBuy(walletAddress, campaignId)

      var maxBuy = maxAllocation

      // check token remain 
      const tokenRemain = await campaignService.getTokenRemainOfCampain(camp[0]);
      // if(maxBuy>tokenRemain) maxBuy=tokenRemain

      // this max buy is IDO token .convert to curency 
      maxBuy = maxBuy * camp[0].token_conversion_rate
      const tier = {
        min_buy: 0,
        max_buy: new BigNumber(maxBuy).toFixed(),
        max_alocation: new BigNumber(maxAllocation).toFixed(),
        start_time: camp[0].start_time || 0,
        end_time: camp[0].finish_time || 0,
        tokenRemain: tokenRemain,
        level: userTier
      }
      console.log('[getCurrentTier] - tier:', JSON.stringify(tier));
      // console.log('[getCurrentTier] - Response:', formatDataPrivateWinner(tier));
      return HelperUtils.responseSuccess((tier));

    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async activeKyc({ request, params }) {
    const inputParams = request.only([
      'wallet_address',
      'email',
    ]);
    try {
      const userService = new UserService();
      const userFound = await userService.findUser(inputParams);
      console.log('[activeKyc] - userFound: ', JSON.stringify(userFound));

      if (!userFound) {
        return HelperUtils.responseNotFound('User Not found');
      }
      if (!userFound.is_kyc) {
        const user = await userService.buildQueryBuilder({ id: userFound.id }).update({ is_kyc: Const.KYC_STATUS.APPROVED });
        console.log('[activeKyc] - User: ', JSON.stringify(user));
      }

      return HelperUtils.responseSuccess({
        ...inputParams,
        id: userFound.id,
      });
    } catch (e) {
      console.log('[activeKyc] - Error: ', e);
      return HelperUtils.responseErrorInternal('Error: Can not active KYC');
    }
  }

  async kycUpdateStatus({ request }) {
    const params = request.only(['guid', 'status', 'clientId', 'event', 'recordId', 'refId', 'submitCount',
      'blockPassID', 'inreviewDate', 'waitingDate', 'approvedDate', 'env']);
    console.log(`KYC update with info ${JSON.stringify(params)}`);
    try {
      // call to api to get user info
      const url = process.env.BLOCK_PASS_API_URL.replace('CLIENT_ID', process.env.BLOCK_PASS_CLIENT_ID)
        .replace('RECORDID', params.recordId);
      console.log(url);
      const options = {
        url: url,
        method: 'GET',
        headers: {
          'Authorization': process.env.BLOCK_PASS_API_KEY
        }
      }
      const response = await new Promise((resolve, reject) => {
        requests(options, function (error, response, body) {
          if (error) reject(error)
          else resolve(response)
        })
      })

      if (!response || response.statusCode !== 200) {
        console.log(`Failed when call block pass api with refID ${params.refId} and ${params.recordId}`);
        return HelperUtils.responseBadRequest();
      }

      // get user info
      const email = JSON.parse(response.body).data.identities.email.value;
      const wallet = JSON.parse(response.body).data.identities.crypto_address_matic.value;
      const kycStatus = JSON.parse(response.body).data.status;

      const address_country = JSON.parse(JSON.parse(response.body).data.identities.address.value).country;
      let passport_issuing_country = address_country;

      if (JSON.parse(response.body).data.identities.passport_issuing_country != null) {
        passport_issuing_country = JSON.parse(response.body).data.identities.passport_issuing_country.value;
      } else if (JSON.parse(response.body).data.identities.national_id_issuing_country != null) {
        passport_issuing_country = JSON.parse(response.body).data.identities.national_id_issuing_country.value;
      } else if (JSON.parse(response.body).data.driving_license_issuing_country != null) {
        passport_issuing_country = JSON.parse(response.body).data.identities.driving_license_issuing_country.value;
      }

      // save to db to log
      const blockPassObj = new BlockPassModel();
      blockPassObj.fill({
        client_id: params.clientId,
        guid: params.guid,
        status: params.status,
        event: params.event,
        record_id: params.recordId,
        ref_id: params.refId,
        submit_count: params.submitCount,
        block_pass_id: params.blockPassID,
        in_review_date: params.inreviewDate,
        waiting_date: params.waitingDate,
        approved_date: params.approvedDate,
        email: email,
        wallet_address: wallet,
        env: params.env
      });
      blockPassObj.save();

      if (Const.KYC_STATUS[kycStatus.toString().toUpperCase()] == Const.KYC_STATUS.APPROVED) {
        const approvedRecord = await BlockpassApprovedModel.query().where('record_id', params.recordId).first();
        if (!approvedRecord) {
          const blockpassApproved = new BlockpassApprovedModel();
          blockpassApproved.fill({
            client_id: params.clientId,
            guid: params.guid,
            status: params.status,
            record_id: params.recordId,
            ref_id: params.refId,
            submit_count: params.submitCount,
            block_pass_id: params.blockPassID,
            in_review_date: params.inreviewDate,
            waiting_date: params.waitingDate,
            approved_date: params.approvedDate,
            email: email,
            wallet_address: wallet,
            env: params.env
          });
          blockpassApproved.save();
        } else {
          approvedRecord.merge({
            client_id: params.clientId,
            guid: params.guid,
            status: params.status,
            record_id: params.recordId,
            ref_id: params.refId,
            submit_count: params.submitCount,
            block_pass_id: params.blockPassID,
            in_review_date: params.inreviewDate,
            waiting_date: params.waitingDate,
            approved_date: params.approvedDate,
            email: email,
            wallet_address: wallet,
            env: params.env
          });
          approvedRecord.save();
        }
      }

      if (!email || !wallet) {
        console.log(`Do not found user with email ${email} and wallet ${wallet}`);
        return HelperUtils.responseBadRequest();
      }

      let user = await UserModel.query().where('email', email).where('wallet_address', wallet).first();

      if (!user) {
        user = new UserModel();
        user.fill({
          email,
          is_kyc: Const.KYC_STATUS.APPROVED,
          wallet_address: wallet,
          record_id: params.recordId,
          ref_id: params.refId,
          status: Const.USER_STATUS.ACTIVE,
          username: email,
          signature: email,
          national_id_issuing_country: passport_issuing_country,
          address_country: address_country
        });
        await user.save();
      } else {
        const userModel = new UserModel();
        userModel.fill({
          ...JSON.parse(JSON.stringify(user)),
          is_kyc: Const.KYC_STATUS[kycStatus.toString().toUpperCase()],
          record_id: params.recordId,
          ref_id: params.refId,
          national_id_issuing_country: passport_issuing_country,
          address_country: address_country
        });
        await UserModel.query().where('id', user.id).update(userModel);
      }
      // // update user KYC status
      // const userModel = new UserModel();
      // userModel.fill({
      //   ...JSON.parse(JSON.stringify(user)),
      //   is_kyc: Const.KYC_STATUS[kycStatus.toString().toUpperCase()],
      //   record_id: params.recordId,
      //   ref_id: params.refId
      // });
      // await UserModel.query().where('id', user.id).update(userModel);

      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('KYC update status failed !');
    }
  }

  async getEPkfBonusBalance({ request }) {
    const inputParams = request.only(['address']);
    const wallet_address = inputParams.address;
    const config = await ConfigModel.query().where('key', wallet_address).first();

    return {
      code: 200,
      message: 'Success',
      data: (new BigNumber((config && config.value) || 0)).multipliedBy(Math.pow(10, 18)).toFixed(),
    }
  }


  async kycUserList({ request }) {
    try {
      const params = request.only(['limit', 'page']);
      const searchQuery = request.input('searchQuery');
      const limit = params.limit || Const.DEFAULT_LIMIT;
      const page = params.page || 1;

      const userService = new UserService();
      let userQuery = userService.buildQueryBuilder(params);
      if (searchQuery) {
        userQuery = userService.buildSearchQuery(userQuery, searchQuery);
      }
      const admins = await userQuery.orderBy('id', 'DESC').paginate(page, limit);
      return HelperUtils.responseSuccess(admins);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: get user list fail !');
    }
  }

  async kycUserDetail({ request, params }) {
    try {
      const id = params.id;
      const userService = new UserService();
      const users = await userService.findUser({ id });
      return HelperUtils.responseSuccess(users);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: get user detail fail !');
    }
  }

  async kycUserCreate({ request }) {
    try {
      const inputs = request.only(['email', 'wallet_address', 'is_kyc', 'national_id_issuing_country']);
      inputs.password = request.input('password');
      console.log('Create Admin with params: ', inputs);

      const userService = new UserService();
      const isExistUser = await userService.findUser({
        wallet_address: inputs.wallet_address,
      });
      if (isExistUser) {
        return HelperUtils.responseBadRequest('Wallet is used');
      }

      const user = new UserModel();
      user.fill(inputs);
      user.signature = randomString(15);  // TODO: Fill any string
      user.status = Const.USER_STATUS.ACTIVE;
      const res = await user.save();

      // const authService = new AuthService();
      // await authService.sendAdminInfoEmail({
      //   user: admin,
      //   password: request.input('password'),
      // });

      return HelperUtils.responseSuccess(res);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: create user fail !');
    }
  }

  async kycUserUpdate({ request, params }) {
    try {
      const inputs = request.only(['email', 'wallet_address', 'is_kyc', 'national_id_issuing_country']);
      const password = request.input('password');
      console.log('Update Kyc User with params: ', params.id, inputs);

      const userService = new UserService();
      const user = await userService.findUser({ id: params.id });
      if (!user) {
        return HelperUtils.responseNotFound();
      }

      const updateInputs = inputs;
      if (password) {
        updateInputs.password = await Hash.make(password);
      }
      await userService.buildQueryBuilder({ id: params.id }).update(updateInputs);

      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Update user fail !');
    }
  }

  async kycUserChangeIsKyc({ request, auth, params }) {
    const inputParams = request.only(['is_kyc']);

    console.log('Update Is Kyc with data: ', inputParams);
    const userId = params.id;
    try {
      const userService = new UserService();
      const user = await userService.findUser({ id: userId });
      if (!user) {
        return HelperUtils.responseNotFound('Pool not found');
      }
      await UserModel.query().where('id', userId).update({
        is_kyc: inputParams.is_kyc,
      });

      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e)
      return HelperUtils.responseErrorInternal();
    }
  }
}

module.exports = UserController;
