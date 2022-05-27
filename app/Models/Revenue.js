/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Revenue extends Model {
  static get table() {
    return 'revenues';
  }
}

module.exports = Revenue;
