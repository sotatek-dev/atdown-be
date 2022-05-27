'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ReservedList extends Model {
  static get table() {
    return 'reserved_list';
  }
}

module.exports = ReservedList
