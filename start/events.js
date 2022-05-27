const Event = use('Event')
const RevenueService = use('App/Services/RevenueService')
const UserBuyCampaign = use('App/Models/UserBuyCampaign')
const WhitelistUser = use('App/Models/WhitelistUser')
const Const = use('App/Common/Const');
const Moment = use('moment')
const Bignumber = use('bignumber.js')
const rp = require('request-promise');
const Redis = use('Redis');
const requestCoinMarket = {
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

Event.on('new::revenue', async (data) => {
  try {
    const amount  = data.transaction.amount_received
    const campaign_hash  = data.campaign_hash
    const unix_timestamp  = data.timestamp
    const datetime = new Date(unix_timestamp * 1000);
    const dataTime = [
      datetime.getHours(),
      datetime.getDate(),
      datetime.getMonth() + 1,
      datetime.getFullYear()
    ];
    const buy_time = Moment(dataTime[3] + '-' + dataTime[2] + '-' + dataTime[1] + ' ' + dataTime[0], "YYYY-MM-DD h").unix();
    const revenueService = new RevenueService();
    await revenueService.createRevenue(amount, dataTime, buy_time, campaign_hash)
  }catch (e){
    console.log(e)
  }
})

Event.on('new:UpdateTotal', async (data) => {
  let ethToUsd = await Redis.get('ethPrice')
  if(!ethToUsd){
    await rp(requestCoinMarket).then( response => {
      ethToUsd = JSON.parse(response).data.ETH.quote.USD.price
      Redis.set('ethPrice', ethToUsd)
      Redis.expire('ethPrice', Const.EXPIRE_ETH_PRICE);
    }).catch(async (err) => {
      await rp(requestCoingecko).then( response => {
        ethToUsd = JSON.parse(response).ethereum.usd
        Redis.set('ethPrice', ethToUsd)
        Redis.expire('ethPrice', Const.EXPIRE_ETH_PRICE);
      }).catch((err)=>{
        console.log('API V2 call error:', err.message);
      })
      console.log('API call error:', err.message);
    });
  }
  const transaction = data.transaction
  const param = data.param
  let usdConvert =param.usdt
  if(param.eth){
    usdConvert = new Bignumber(param.eth).multipliedBy(ethToUsd).toFixed();
  }
  const findTotal = await UserBuyCampaign.query()
    .where('user_address', param.user_address)
    .where('campaign_hash', param.campaign_hash)
    .first();
  if(!findTotal){
    const updateTotal = new UserBuyCampaign();
    updateTotal.user_address = param.user_address
    updateTotal.role = Const.USER_ROLE.PUBLIC_USER;
    updateTotal.campaign_hash = param.campaign_hash
    updateTotal.total_usd = usdConvert
    await updateTotal.save()
  }else {
    console.log('usd buy',usdConvert)
    console.log('usd buyed',findTotal.total_usd)
    findTotal.total_usd = new Bignumber(usdConvert).plus(findTotal.total_usd).toFixed();
    console.log('11', findTotal.total_usd)
    await findTotal.save();
  }

})

Event.on('new:createWhitelist', async (param) => {
  const whitelistUser = await WhitelistUser.query().where('email', param.email).where('wallet_address', param.wallet_address).first();
  if(!whitelistUser){
    const newWhitelist = new WhitelistUser();
    newWhitelist.email = param.email
    newWhitelist.wallet_address = param.wallet_address
    await newWhitelist.save()
  }
})
