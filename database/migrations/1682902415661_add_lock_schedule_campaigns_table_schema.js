'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class AddLockScheduleToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.string('lock_schedule').nullable();
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddLockScheduleToCampaignsTableSchema;
