'user strict'

const RevenueModel = use('App/Models/Revenue')
const Moment = use('moment')
const HelperUtils = use('App/Common/HelperUtils');

class RevenueController {
  async getRevenue({request}) {
    try {
      const campaign_hash = request.params.campaign;
      const dateTimeNow = Moment().startOf('hour').unix()
      var dateTimePast = Moment().add(-2, 'd').add(1, 'h').startOf('hour').unix()
      const result = await RevenueModel.query().where('campaign_hash', campaign_hash).where('time_buy', '>=', dateTimePast).orderBy('time_buy').fetch();
      const rersultJson = JSON.parse(JSON.stringify(result))
      const array_time = []
      rersultJson.map(function (value) {
        array_time.push(value.time_buy)
      })
      const data = {}
      do {
        const index = array_time.includes(String(dateTimePast))
        if (index == false) {
          let timeNot = Moment.unix(dateTimePast)
          let revenueCreate = {
            amount_total: 0,
            hour: timeNot.hour(),
            day: timeNot.date(),
            month: timeNot.month() + 1,
            year: timeNot.year(),
            time_buy: dateTimePast,
          }
          rersultJson.push(revenueCreate)
        }
        dateTimePast += 3600
      } while (dateTimePast <= dateTimeNow)
      return HelperUtils.responseSuccess(rersultJson);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseBadRequest('ERROR: Get revenue fail !');
    }
  }
}

module.exports = RevenueController
