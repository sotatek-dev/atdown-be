/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class UserBuyCampaign extends Model {
  static get table() {
    return 'user_buy_campaigns';
  }
}

module.exports = UserBuyCampaign;
