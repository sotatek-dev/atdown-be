'use strict'

const { Command } = require('@adonisjs/ace');
const HelperUtils = use('App/Common/HelperUtils');
const CampaignModel = use('App/Models/Campaign');

const Web3 = require('web3');
const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);

const { exit } = require('process');

class SignatureCommand extends Command {
  static get signature () {
    return `
      sign:key
      {minBuy: Min Buy}
      {maxBuy: Max Buy}
      {privateKey: Private Key}
      {userWallet: User Wallet}
    `;
  }

  static get description () {
    return 'Signature Max Buy / Min Buy to deposit (Buy) token. Usage: adonis sign:key {minBuy} {maxBuy} {privateKey} {userWallet}';
  }

  async handle (args, options) {
    this.info('Starting !!!');
    console.log('args', args);
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);

    const minTokenAmount = args.minBuy || 0;
    const maxTokenAmount = args.maxBuy;
    const privateKey = args.privateKey;
    const userWalletAddress = args.userWallet;

    const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
    const messageHash = web3.utils.soliditySha3(userWalletAddress, maxTokenAmount, minTokenAmount);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const accAddress = HelperUtils.checkSumAddress(account.address);

    console.log('messageHash', messageHash);
    console.log('accAddress', accAddress);

    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = accAddress;
    const signature = await web3.eth.sign(messageHash, accAddress);

    this.info('Sign Success.');
    console.log(`Signature: ${signature}`);
    this.info('Finished !!!');
    process.exit(0);
  }
}

module.exports = SignatureCommand;
