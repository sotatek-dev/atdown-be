'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CaptchaWhitelistSchema extends Schema {
  up () {
    this.create('captcha_whitelists', (table) => {
      table.increments()
      table.string('address', 254).notNullable().unique()
      table.timestamps()
    })
  }

  down () {
    this.drop('captcha_whitelists')
  }
}

module.exports = CaptchaWhitelistSchema
