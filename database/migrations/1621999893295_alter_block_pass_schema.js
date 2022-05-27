'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterBlockPass extends Schema {
  up () {
    this.table('block_pass', (table) => {
      // drop old column
      table.dropColumn('clientId');
      table.dropColumn('recordId');
      table.dropColumn('refId');
      table.dropColumn('submitCount');
      table.dropColumn('blockPassID');
      table.dropColumn('inreviewDate');
      table.dropColumn('waitingDate');
      table.dropColumn('approvedDate');
      // create new column
      table.string('client_id', 255).nullable();
      table.string('record_id', 255).nullable();
      table.string('ref_id', 255).nullable();
      table.integer('submit_count').unsigned().nullable();
      table.string('block_pass_id', 255).nullable();
      table.string('in_review_date', 255).nullable();
      table.string('waiting_date', 255).nullable();
      table.string('approved_date', 255).nullable();
    })
  }

  down () {
    this.table('block_pass', (table) => {
    })
  }
}

module.exports = AlterBlockPass;
