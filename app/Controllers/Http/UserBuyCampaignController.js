'use strict'

const Const = use('App/Common/Const');
const UserBuyCampaign = use('App/Models/UserBuyCampaign')
const HelperUtils = use('App/Common/HelperUtils');
const Bignumber = use('bignumber.js')
const rp = require('request-promise');
const Redis = use('Redis');
const requestOptions = {
  method: 'GET',
  uri: process.env.URL_CONVERT_ETH,
  headers: {
    'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
    'Accept': 'application/json'
  }
};
const requestCoingecko = {
  method: 'GET',
  uri: process.env.URL_CONVERT_ETH_V2,
};


class UserBuyCampaignController {
  async checkBuy({request, auth}) {
    try {
      const param = request.all();
      const user = auth.user
      let ethToUsd = await Redis.get('ethPrice')
      if (!ethToUsd) {
        await rp(requestOptions).then(response => {
          ethToUsd = JSON.parse(response).data.ETH.quote.USD.price
          Redis.set('ethPrice', ethToUsd)
          Redis.expire('ethPrice', Const.EXPIRE_ETH_PRICE);
        }).catch(async (err) => {
          await rp(requestCoingecko).then(response => {
            ethToUsd = JSON.parse(response).ethereum.usd
            Redis.set('ethPrice', ethToUsd)
            Redis.expire('ethPrice', Const.EXPIRE_ETH_PRICE);
          }).catch((err) => {
            console.log('API V2 call error:', err.message);
          })
          console.log('API call error:', err.message);
        });
      }
      const ethConvert = new Bignumber(param.eth || 0).multipliedBy(ethToUsd).toFixed();
      const find = await UserBuyCampaign.query()
        .where('user_address', user.wallet_address)
        .where('role', user.role)
        .where('campaign_hash', param.campaign)
        .first()
      let symbol = 'USDT';
      if (!find) {
        if (ethConvert > Const.MAX_BUY_CAMPAIGN || param.usdt > Const.MAX_BUY_CAMPAIGN) {
          let token = Const.MAX_BUY_CAMPAIGN
          if (param.eth && param.eth != 0) {
            token = new Bignumber(Const.MAX_BUY_CAMPAIGN).dividedBy(ethToUsd).toFixed(18);
            symbol = 'ETH'
          }
          return HelperUtils.responseBadRequest("You've reached the maximum amount of tokens. You can only buy up to " + token + " " + symbol)
        } else
          return HelperUtils.responseSuccess()
      } else {
        let totalBuy = param.usdt
        if (ethConvert && ethConvert != 0)
          totalBuy = ethConvert
        const totalWillBuy = new Bignumber(find.total_usd || 0).plus(totalBuy).toFixed();
        if (totalWillBuy > Const.MAX_BUY_CAMPAIGN) {
          let tokenCanBuy = new Bignumber(Const.MAX_BUY_CAMPAIGN).minus(find.total_usd || 0).toFixed()
          if (param.eth && param.eth != 0) {
            symbol = 'ETH'
            tokenCanBuy = new Bignumber(tokenCanBuy).dividedBy(ethToUsd).toFixed(18)
          }
          return HelperUtils.responseBadRequest("You've reached the maximum amount of tokens. You can only buy up to " + tokenCanBuy + " " + symbol)
        }
        return HelperUtils.responseSuccess();
      }
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }


  async getUserBuy({request}) {
    try {
      const param = request.all();
      const find = await UserBuyCampaign.query()
        .where('user_address', param.address)
        .where('campaign_hash', param.campaign)
        .first();
      if (!find) {
        return HelperUtils.responseSuccess({
          total_usd: 0,
        });
      }
      return HelperUtils.responseSuccess(find)
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }
}

module.exports = UserBuyCampaignController
