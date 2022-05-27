'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');
const Const = use('App/Common/Const');

class AddIsPrivateFieldToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.boolean('is_private').nullable().defaultTo(Const.POOL_IS_PRIVATE.PUBLIC);
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddIsPrivateFieldToCampaignsTableSchema;
