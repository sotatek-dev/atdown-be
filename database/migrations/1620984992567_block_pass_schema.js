'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BlockPassSchema extends Schema {
  up () {
    this.create('block_pass', (table) => {
      table.increments();
      table.string('guid', 255).nullable();
      table.string('status',255).nullable();
      table.string('clientId', 255).nullable();
      table.string('event', 255).nullable();
      table.string('recordId',255).nullable();
      table.string('refId',255).nullable();
      table.integer('submitCount').unsigned().nullable();
      table.string('blockPassID',255).nullable();
      table.string('inreviewDate',255).nullable();
      table.string('waitingDate',255).nullable();
      table.string('approvedDate',255).nullable();
      table.string('env',255).nullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('block_pass');
  }
}

module.exports = BlockPassSchema
