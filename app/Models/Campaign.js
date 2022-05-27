/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Campaign extends Model {
  static get table() {
    return 'campaigns';
  }

  fcfsRoundsSetting() {
    return this.hasMany('App/Models/FcfsRoundSetting', 'id', 'campaign_id');
  }

  transaction() {
    return this.hasMany('App/Models/Transaction', 'id', 'campaign_id');
  }

  affiliateCampaign() {
    return this.hasMany('App/Models/AffiliateCampaign', 'id', 'campaign_id');
  }

  tiers() {
    return this.hasMany('App/Models/Tier')
  }

  winners() {
    return this.hasMany('App/Models/WinnerListUser')
  }

  whitelistUsers() {
    return this.hasMany('App/Models/WhitelistUser')
  }

  userBalanceSnapshots() {
    return this.hasMany('App/Models/UserBalanceSnapshot')
  }

  campaignClaimConfig() {
    return this.hasMany('App/Models/CampaignClaimConfig')
  }

  whitelistBannerSetting() {
    return this.hasOne('App/Models/WhitelistBannerSetting')
  }

  userBalanceSnapshotsPre() {
    return this.hasMany('App/Models/UserBalanceSnapshotPre')
  }

  socialNetworkSetting() {
    return this.hasOne('App/Models/SocialNetworkSetting')
  }

  socialRequirement() {
    return this.hasOne('App/Models/CampaignSocialRequirement')
  }

  whitelistSubmissions() {
    return this.hasMany('App/Models/UserWhitelistSubmission')
  }

  freeBuyTimeSetting() {
    return this.hasOne('App/Models/FreeBuyTimeSetting')
  }

  preOrderUsers() {
    return this.belongsToMany('App/Models/User').pivotTable('user_pre_orders').withPivot('amount');
  }

}

module.exports = Campaign;
