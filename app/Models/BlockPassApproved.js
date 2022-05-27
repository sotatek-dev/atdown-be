'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BlockPassApproved extends Model {
  static get table() {
    return 'block_pass_approved';
  }
}

module.exports = BlockPassApproved
