'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Database = use('Database')
const Webhook = use('App/Models/Webhook')
const Const = use('App/Common/Const');
const Env = use('Env')

class WebhookSeeder {
  async run () {
    const host = Env.get('SEED_URL');

    // Clear DB
    await Webhook.query().truncate();

    const webhooks = [
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'TokenPurchaseByEther',
        url: 'webhook/transaction',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'TokenPurchaseByToken',
        url: 'webhook/transaction',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'TokenPurchaseByEtherWithEthLink',
        url: 'webhook/transaction',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'Pause',
        url: 'webhook/campaign-status',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'Unpause',
        url: 'webhook/campaign-status',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'CampaignStatsChanged',
        url: 'webhook/campaign-changed',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'RefundedTokenForIcoWhenEndIco',
        url: 'webhook/transaction-refund',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGN,
        type: 'TokenClaimed',
        url: 'webhook/token-claimed',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGNFACTORY,
        type: 'IcoCampaignCreated',
        url: 'webhook/ico-campaign',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGNFACTORY,
        type: 'IcoCampaignCreatedWithEthLink',
        url: 'webhook/ico-campaign',
      },
      {
        contract_name: Const.CONTRACTS.CAMPAIGNFACTORY,
        type: 'PoolCreated',
        url: 'webhook/ico-campaign',
      },
      {
        contract_name: Const.CONTRACTS.ETHLINK,
        type: 'NewCampaign',
        url: 'webhook/affiliate-campaign',
      },
      {
        contract_name: Const.CONTRACTS.TIER,
        type: 'StakedERC20',
        url: 'webhook/mantra-stake/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.TIER,
        type: 'WithdrawnERC20',
        url: 'webhook/mantra-stake/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.TIER,
        type: 'StakedERC20',
        url: 'webhook/reputation/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.TIER,
        type: 'WithdrawnERC20',
        url: 'webhook/reputation/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.STAKING_POOL,
        type: 'AllocDeposit',
        url: 'webhook/reputation/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.STAKING_POOL,
        type: 'AllocWithdraw',
        url: 'webhook/reputation/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.STAKING_POOL,
        type: 'LinearDeposit',
        url: 'webhook/reputation/index-stake-info',
      },
      {
        contract_name: Const.CONTRACTS.STAKING_POOL,
        type: 'LinearWithdraw',
        url: 'webhook/reputation/index-stake-info',
      },
    ];

    for (let i = 0; i < webhooks.length; i++) {
      let webhookObj = new Webhook();
      webhookObj.contract_name = webhooks[i].contract_name;
      webhookObj.type = webhooks[i].type;
      webhookObj.url = host + '/' + webhooks[i].url;
      await webhookObj.save();
    }
  }
}

module.exports = WebhookSeeder;
