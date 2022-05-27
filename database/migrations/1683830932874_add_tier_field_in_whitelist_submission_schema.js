'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTierFieldInWhitelistSubmissionSchema extends Schema {
  up () {
    this.table('whitelist_submissions', (table) => {
      this.table('whitelist_submissions', (table) => {
        // alter table
        table.integer('tier');
      })
    })
  }

  down () {
    this.table('whitelist_submissions', (table) => {
      table.dropColumn('tier');
    })
  }
}

module.exports = AddTierFieldInWhitelistSubmissionSchema
