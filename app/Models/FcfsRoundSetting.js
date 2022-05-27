'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FcfsRoundModel extends Model {
  static get table() {
    return 'fcfs_round_settings';
  }
}

module.exports = FcfsRoundModel;
