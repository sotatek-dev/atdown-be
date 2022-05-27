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
const Factory = use('Factory')
const Database = use('Database')
const Config = use('App/Models/Config')

class ConfigSeeder {
  async run () {
    const config = [
      {
        key: 'countdown',
        value: '2021-04-30 19:18:30'
      }
    ];

    for (let i = 0; i < config.length; i++) {
      let configObj = new Config();
      configObj.key = config[i].key;
      configObj.value = config[i].value;
      await configObj.save();
    }
  }
}

module.exports = ConfigSeeder
