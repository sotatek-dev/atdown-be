'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const')

class WhitelistSubmissionSchema extends Schema {
  up() {
    this.create('whitelist_submissions', (table) => {
      table.increments()
      table.string('wallet_address', 255).notNullable();
      table.integer('campaign_id').unsigned().references('id').inTable('campaigns')
      table.integer('whitelist_user_id').unsigned().references('id').inTable('whitelist_users')
      table.string('user_telegram')
      table.string('user_twitter')
      table.tinyint('self_twitter_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('self_group_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('self_channel_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('self_retweet_post_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.string('self_retweet_post_link')
      table.tinyint('partner_twitter_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('partner_group_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('partner_channel_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.tinyint('partner_retweet_post_status', '0').notNullable().default(Const.SOCIAL_SUBMISSION_STATUS.PENDING);
      table.string('partner_retweet_post_link')
      table.timestamps()
    })
  }

  down() {
    this.drop('whitelist_submissions')
  }
}

module.exports = WhitelistSubmissionSchema
