'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CampaignClaimConfig extends Model {
  static get table() {
    return 'campaign_claim_config';
  }
}

module.exports = CampaignClaimConfig
