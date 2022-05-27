/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class BlockPass extends Model {
  static get table() {
    return 'block_pass';
  }
}

module.exports = BlockPass;
