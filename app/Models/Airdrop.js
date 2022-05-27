'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Airdrop extends Model {
  static get table() {
    return 'airdrops';
  }
}

module.exports = Airdrop;
