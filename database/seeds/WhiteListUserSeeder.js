'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const WhitelistUer = use('App/Models/WhitelistUser')

class WhiteListUserSeeder {
  async run () {
    const userWhitelist = [
      // {
      //   wallet_address: "",
      //   email: ""
      // }
    ];
    for (let i = 0; i < userWhitelist.length; i++) {
      let whitelistUer = new WhitelistUer();
      whitelistUer.wallet_address = userWhitelist[i].wallet_address;
      whitelistUer.email = userWhitelist[i].email;
      await whitelistUer.save();
    }
  }
}

module.exports = WhiteListUserSeeder
