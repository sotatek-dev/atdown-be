'use strict'

const ReservedListService = use('App/Services/ReservedListService')
const WhitelistService = use('App/Services/WhitelistUserService');
const WhitelistSubmissionService = use('App/Services/WhitelistSubmissionService');
const HelperUtils = use('App/Common/HelperUtils');
const ReservedListModel = use('App/Models/ReservedList');
const ConfigModel = use('App/Models/Config');
const BigNumber = use('bignumber.js')
const moment = require('moment')

const Redis = use('Redis');

class ReservedListController {

  async getReservedList({ request }) {
    // get request params
    const campaign_id = request.params.campaignId;
    const page = request.input('page');
    const pageSize = request.input('limit') ? request.input('limit') : 10;
    console.log(`start getReservedList with campaign_id ${campaign_id} and page ${page} and pageSize ${pageSize}`);
    try {
      // get from redis cached
      let redisKey = 'reserved_' + campaign_id;
      if (page) {
        redisKey = redisKey.concat('_', page, '_', pageSize);
      }
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
        'search_term': request.input('search_term') || '',
      };
      const reservedListService = new ReservedListService();
      // get winner list
      const whitelist = await reservedListService.findByCampaign(filterParams);
      // save to redis
      await Redis.set(redisKey, JSON.stringify(whitelist));
      return HelperUtils.responseSuccess(whitelist);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Get Reserved List Failed !');
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
      const reservedListService = new ReservedListService();
      const result = await reservedListService.search(searchParams);
      return HelperUtils.responseSuccess(result);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Find Reserved Error !');
    }
  }

  async create({ request }) {
    // get request params
    const createParams = {
      'campaign_id': request.params.campaignId,
      'email': request.params.email,
      'wallet_address': request.params.wallet_address,
      'start_time': request.params.start_time,
      'end_time': request.params.end_time,
      'min_buy': request.params.min_buy,
      'max_buy': request.params.max_buy
    }
    try {
      const reservedListService = new ReservedListService();
      const result = await reservedListService.create(createParams);
      return HelperUtils.responseSuccess(result);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Insert New Reserved Error !');
    }
  }

  async deleteReserve({ request, params }) {
    try {
      console.log('[deleteReserve] - Delete Winner with params: ', params, request.params);

      const { campaignId, walletAddress } = params;
      const reservedService = new ReservedListService();
      const whitelistService = new WhitelistService();
      const whitelistSubmissionService = new WhitelistSubmissionService()

      const reservedRecord = await reservedService
        .buildQueryBuilder({
          campaign_id: campaignId,
          wallet_address: walletAddress,
        })
        .first();

      if (reservedRecord) {
        console.log('[deleteReserve] =======> reservedRecord', reservedRecord.toJSON());
        await reservedRecord.delete();

        const whitelistSubmissionRecord = await whitelistSubmissionService
          .buildQueryBuilder({
            campaign_id: campaignId,
            wallet_address: walletAddress,
          })
          .first();

        if (whitelistSubmissionRecord) {
          console.log('[deleteReserve] =======> whitelistSubmissionRecord', whitelistSubmissionRecord.toJSON());
          await whitelistSubmissionRecord.delete();
        }

        const whitelistRecord = await whitelistService
          .buildQueryBuilder({
            campaign_id: campaignId,
            wallet_address: walletAddress,
          })
          .first();

        if (whitelistRecord) {
          console.log('[deleteReserve] =======> whitelistRecord', whitelistRecord.toJSON());
          await whitelistRecord.delete();
        }
      }

      return HelperUtils.responseSuccess(reservedRecord);
    } catch (e) {
      console.log(e)
      return HelperUtils.responseErrorInternal();
    }
  }

  async addReserveUser({ request, params }) {
    try {
      const { campaignId } = params;
      const inputParams = request.only(['email', 'wallet_address']);
      console.log('[addReserveUser] - Params: ', params, inputParams);

      const reservedUser = new ReservedListModel;
      reservedUser.campaign_id = campaignId;
      reservedUser.email = inputParams.email;
      reservedUser.wallet_address = inputParams.wallet_address;
      await reservedUser.save();

      console.log('Res: ', reservedUser);
      return HelperUtils.responseSuccess(reservedUser);
    } catch (e) {
      return HelperUtils.responseErrorInternal();
    }
  }

  async checkExistReserve({ request, params }) {
    try {
      console.log('[checkExistReserve] - Params: ', params);
      const inputParams = request.only(['wallet_address', 'campaign_id']);

      const existRecord = await (new ReservedListService()).buildQueryBuilder({
        wallet_address: inputParams.wallet_address,
        campaign_id: inputParams.campaign_id,
      }).first();
      if (!existRecord) {
        return HelperUtils.responseNotFound('User not exist in Reserve User List');
      }
      console.log('existRecord: ', existRecord);

      return HelperUtils.responseSuccess(existRecord, 'User exist in Reserve User List');
    } catch (e) {
      return HelperUtils.responseErrorInternal('Check Exist Reserve Error !');
    }
  }

  async updateReserveSetting({ request, params }) {
    try {
      const inputParams = request.only(['maxBuy', 'minBuy', 'startTime', 'endTime']);
      console.log('[addReserveUser] - Params: ', params, inputParams);
      const updateData = {
        max_buy: new BigNumber(inputParams.maxBuy).toFixed(),
        min_buy: new BigNumber(inputParams.minBuy).toFixed(),
        start_time: inputParams.startTime,
        end_time: inputParams.endTime,
        start_time_unix: moment(inputParams.startTime).unix(),
        end_time_unix: moment(inputParams.endTime).unix(),
      };

      const configReserve = await ConfigModel.query().where('key', 'reserve_setting').first();
      if (!configReserve) {
        const reserveSetting = new ConfigModel;
        reserveSetting.key = 'reserve_setting';
        reserveSetting.value = JSON.stringify(updateData);
        await reserveSetting.save();
      }
      await ConfigModel.query().where('key', 'reserve_setting').update({ value: JSON.stringify(updateData) });

      await ReservedListModel.query().update({
        start_time: updateData.start_time,
        end_time: updateData.end_time,
        max_buy: updateData.max_buy,
        min_buy: updateData.min_buy,
      });

      console.log('[updateReserveSetting] - response: ', JSON.stringify(updateData));
      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log('[updateReserveSetting] - Error: ', e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async reserveSetting({ request, params }) {
    try {
      const configReserve = await ConfigModel.query().where('key', 'reserve_setting').first();
      if (!configReserve) {
        return HelperUtils.responseSuccess(null);
      }

      const responseData = JSON.parse((configReserve && configReserve.value) || '');
      console.log('[reserveSetting] - response: ', JSON.stringify(responseData));
      return HelperUtils.responseSuccess(responseData);
    } catch (e) {
      console.log('[reserveSetting] - Error: ', e);
      return HelperUtils.responseErrorInternal();
    }
  }

}

module.exports = ReservedListController
