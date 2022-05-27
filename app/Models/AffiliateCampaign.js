/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class affiliateCampaign extends Model {
  static get table() {
    return 'affiliate_campaigns';
  }
}

module.exports = affiliateCampaign;
