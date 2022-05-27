/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class campaignTotal extends Model {
  static get table() {
    return 'campaign_totals';
  }
}

module.exports = campaignTotal;
