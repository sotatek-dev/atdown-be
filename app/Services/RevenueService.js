'use strict'

const RevenueModel = use('App/Models/Revenue')
const BigNumber = use('bignumber.js');

class RevenueService {
  async createRevenue(amount, time, time_buy, campaign_hash){
    const findRow = await RevenueModel.query()
      .where('hour', time[0])
      .where('day', time[1])
      .where('month', time[2])
      .where('year', time[3])
      .first();
    if(!findRow){
      const revenue = new RevenueModel;
      revenue.amount_total = amount;
      revenue.campaign_hash = campaign_hash;
      revenue.hour = time[0];
      revenue.day = time[1];
      revenue.month = time[2];
      revenue.year = time[3];
      revenue.time_buy = time_buy;
      await revenue.save();
    }else {
      findRow.amount_total = new BigNumber(findRow.amount_total || 0).plus(amount).toFixed();
      await findRow.save();
    }
  }
}
module.exports = RevenueService
