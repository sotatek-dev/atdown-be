'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class UserSchema extends Schema {
  up () {
    this.create('admins', (table) => {
      table.increments()
      table.string('username', 255).nullable();
      table.string('email', 255).nullable();
      table.string('password', 255).nullable();
      table.string('signature', 255).nullable();
      table.string('token_jwt', 255).nullable();
      table.boolean('is_active').notNullable().defaultTo(0);
      table.tinyint('status', '1').notNullable().default('1');
      table.tinyint('role').notNullable().default(Const.USER_ROLE.ICO_OWNER);
      table.tinyint('type').notNullable().default(Const.USER_TYPE.REGULAR);
      table.string('wallet_address').notNullable();
      table.string('firstname', 255).nullable();
      table.string('lastname', 255).nullable();
      table.date('birthday').nullable();
      table.string('gender', 50).nullable();
      table.string('phone', 50).nullable();
      table.string('avatar', 255).nullable();
      table.string('confirmation_token', 255).nullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('admins')
  }
}

module.exports = UserSchema
