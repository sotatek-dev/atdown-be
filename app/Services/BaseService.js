/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */

class BaseService {
  constructor(trx) {
    this._trx = trx;
  }

  get trx() {
    return this._trx;
  }

  m(modelPath, applyScope = true) {
    const OriginModel = require(`../Models/${modelPath}`);
    return OriginModel;
  }
}

module.exports = BaseService;
