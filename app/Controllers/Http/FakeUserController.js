'use strict'

// const FakeUser = use('App/Models/FakeUser');
const WhitelistModel = use('App/Models/WhitelistUser');

var faker = require('faker');

class FakeUserController {
  async insertMany({request, params}) {
    //add fake user to whiteList
    const tier = params.tier;
    const campaign_id=params.campaign_id
    console.log(tier,campaign_id)
    const UserFake=[]
    for (let i = 0; i < 10; i++) { 
        UserFake.push({
          tier:tier,
          campaign_id:campaign_id,
          wallet_address: faker.finance.ethereumAddress(),
        });
      }
    console.log(UserFake)
    await WhitelistModel.createMany(UserFake)
  }
}

module.exports = FakeUserController;
