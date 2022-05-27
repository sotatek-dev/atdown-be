'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BlockPassApprovedSchema extends Schema {
  up () {
    this.create('block_pass_approved', (table) => {
      table.increments()
      table.string('guid', 255).nullable();
      table.string('email');
      table.string('wallet_address');
      table.string('status',255).nullable();
      table.string('env',255).nullable();
      table.string('client_id', 255).nullable();
      table.string('record_id', 255).nullable();
      table.string('ref_id', 255).nullable();
      table.integer('submit_count').unsigned().nullable();
      table.string('block_pass_id', 255).nullable();
      table.string('in_review_date', 255).nullable();
      table.string('waiting_date', 255).nullable();
      table.string('approved_date', 255).nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('block_pass_approved')
  }
}

module.exports = BlockPassApprovedSchema
