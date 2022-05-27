'use strict'


const BlockPassModel = use('App/Models/BlockPass');

class BlockPassService {
  buildQueryBuilder(params) {
    let builder = BlockPassModel.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.level) {
      builder = builder.where('level', params.level);
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }
    return builder;
  }

  async findOneByFilter(filterParams) {
    return await this.buildQueryBuilder(filterParams).first();
  }

  async findAllByFilter(filterParams) {
    return await this.buildQueryBuilder(filterParams).fetch();
  }
}

module.exports = BlockPassService
