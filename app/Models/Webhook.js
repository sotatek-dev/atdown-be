/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Webhook extends Model {
  static get table() {
    return 'webhook';
  }
}

module.exports = Webhook;
