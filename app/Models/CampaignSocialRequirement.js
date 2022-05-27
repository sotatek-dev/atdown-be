'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CampaignSocialRequirement extends Model {
  static get table() {
    return 'campaign_social_requirements'
  }

}

module.exports = CampaignSocialRequirement
