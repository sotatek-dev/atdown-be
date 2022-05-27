'use strict'
const Congfig = use('App/Models/Config');
const HelperUtils = use('App/Common/HelperUtils');

class ConfigController {
  async getConfig( {request}) {
    try {
      const countdown = await Congfig.query().where('key', 'countdown').first()
      return HelperUtils.responseSuccess(countdown)
    } catch (e){
      console.error(e);
      return HelperUtils.responseErrorInternal('ERROR: Get config fail !');
    }
  }

}

module.exports = ConfigController
