'use strict'

const CaptchaWhitelist = use('App/Models/CaptchaWhitelist');
const HelperUtils = use('App/Common/HelperUtils');

class CaptchaWhitelistController {
  async get({ request }) {
    try {
      const whitelist = await CaptchaWhitelist.all()
      return HelperUtils.responseSuccess(whitelist);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Get whitelist failed');
    }
  }

  async set({ request }) {
    try {
      const params = request.all();
      if (!params.address) {
        return HelperUtils.responseErrorInternal('Invalid address');
      }
      const isWhitelist = await CaptchaWhitelist.query().where('address', params.address.toLowerCase()).getCount()
      if (isWhitelist > 0) {
        return HelperUtils.responseErrorInternal('Address is already exists');
      }
      const address = new CaptchaWhitelist()
      address.address = params.address.toLowerCase()
      await address.save()
      return HelperUtils.responseSuccess('Insert whitelist successful');
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Insert whitelist failed');
    }
  }

  async remove({ request }) {
    try {
      const params = request.all();
      if (!params.address) {
        return HelperUtils.responseErrorInternal('Invalid address');
      }
      await CaptchaWhitelist.query().where('address', params.address.toLowerCase()).delete()
      return HelperUtils.responseSuccess('Delete whitelist successful');
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Delete whitelist failed');
    }
  }
}

module.exports = CaptchaWhitelistController
