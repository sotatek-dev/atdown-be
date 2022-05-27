'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class AddFieldIsKycToUserTableSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.boolean('is_kyc').nullable().default(Const.KYC_STATUS.INCOMPLETE);
    })
  }

  down () {
    this.table('users', (table) => {
    })
  }
}

module.exports = AddFieldIsKycToUserTableSchema;
