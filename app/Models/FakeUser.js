'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FakeUser extends Model {
  static get table() {
    return 'fake_user';
  }
}

module.exports = FakeUser;
