'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class AddPickWinnerRuleToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.string('pick_winner_rule').nullable();
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddPickWinnerRuleToCampaignsTableSchema;
