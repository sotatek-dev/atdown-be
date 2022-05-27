'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')
module.exports = {
  zero_hex : '0x0000000000000000000000000000000000000000',
  limit_default: 10,
  page_default: 1,
  decimal_default: 18,

  event_by_token: 'TokenPurchaseByToken',
  event_by_ether: 'TokenPurchaseByEther',
  event_by_eth_with_eth: 'TokenPurchaseByEtherWithEthLink',
  event_ico_create_campaign: 'IcoCampaignCreated',
  event_ico_create_eth_link: 'IcoCampaignCreatedWithEthLink',
  pause: 'Pause',
  up_pause: 'Unpause',
  TokenPurchaseByEther: 'buyWithEther',
  TokenPurchaseByToken: 'buyWithToken',
  TokenPurchaseByEtherWithEthLink: 'buyWithEtherWithETHLink',
  RefundedTokenForIcoWhenEndIco: 'Refund',
  TokenClaimed: 'TokenClaimed',

  suspend: 'suspend',
  active: 'active',
  processing: 'processing',
  processingValue: 2,
  user: 1,
  public: 2,
  status_active: 1,
  status_queue: 2,
  status_archive: 3,
  status_current: 1,
  status_upcoming: 2,
  status_past: 3,
}
