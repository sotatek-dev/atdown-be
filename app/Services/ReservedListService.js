'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const ReservedListModel = use('App/Models/ReservedList');

class ReservedListService {
  buildQueryBuilder(params) {
    let builder = ReservedListModel.query();
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
        query.where('wallet_address', 'like', '%'+ params.search_term +'%')
          .orWhere('email', 'like', '%'+ params.search_term +'%');
      })
    }

    return builder;
  }

  buildSearchQuery(params) {
    let builder = ReservedListModel.query();
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

  async findByCampaign(params) {
    let builder = this.buildQueryBuilder(params);
    if (params.page && params.pageSize) {
      // pagination
      return await builder.paginate(params.page, params.pageSize);
    }
    // return all result
    return await builder.fetch();
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

  async findOneByFilter(filterParams) {
    return await this.buildQueryBuilder(filterParams).first();
  }

  async create(params) {
    const reserved =new ReservedListModel;
    reserved.campaign_id = params.campaign_id;
    reserved.wallet_address = params.wallet_address;
    reserved.email = params.email;
    reserved.start_time = params.start_time;
    reserved.end_time = params.end_time;
    reserved.max_buy = params.max_buy;
    reserved.min_buy = params.min_buy;
    reserved.level = params.level;
    reserved.save();
  }
}
module.exports = ReservedListService
