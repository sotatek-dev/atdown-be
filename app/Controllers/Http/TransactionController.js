'use strict'

const TransactionModel = use('App/Models/Transaction');
const TransactionService = use('App/Services/TransactionService');
const CampaignModel = use('App/Models/Campaign');
const CampaignTotalService = use('App/Services/CampaignTotalService');
const AssetTokenService = use('App/Services/AssetTokenService');
const Const = use('App/Common/Const');
const ErrorFactory = use('App/Common/ErrorFactory');
const CONFIGS_FOLDER = '../../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGNFACTORY];
const {abi: CONTRACT_ABI} = CONTRACT_CONFIGS.CONTRACT_DATA;

const {abi: CONTRACT_ERC20_ABI} = require('../../../blockchain_configs/contracts/Normal/Erc20.json');
const {abi: CONTRACT_CAMPAIGN_ABI} = require('../../../blockchain_configs/contracts/Normal/Campaign.json');

const Web3 = require('web3');
const Event = use('Event')
const moment = require('moment');
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
const Config = use('Config')
const BigNumber = use('bignumber.js');
const HelperUtils = use('App/Common/HelperUtils');

class TransactionController {

  async checkTransactionExist(transactionHash) {
    try {
      console.log(`Check Transaction Exist in Blockchain with transaction_hash: ${transactionHash}`);
      const tx = await web3.eth.getTransaction(transactionHash);
      console.log(tx);

      return tx;
    } catch (e) {
      console.log('Transaction is not exist: ', e);
      return false;
    }
  }

  async checkCampaignExist(campaignHash) {
    try {
      const contract = new web3.eth.Contract(CONTRACT_CAMPAIGN_ABI, campaignHash);

      console.log(`Check Transaction Exist in Blockchain with campaign_hash ${campaignHash}`);
      const receipt = await Promise.all([
        contract.methods.name().call(),
      ]);
      console.log(receipt);

      return receipt.length === 1 && receipt[0];
    } catch (e) {
      console.log('Campaign is not exist: ', e);
      return false;
    }
  }

  async transactionAdd({request}) {
    try {
      const param = request.all();
      const isExistTransaction = await this.checkTransactionExist(param.transaction_hash);
      if (!isExistTransaction) {
        return HelperUtils.responseNotFound('Transaction is not exist !');
      }

      const isExistCampaign = await this.checkCampaignExist(param.campaign_hash);
      if (!isExistCampaign) {
        return HelperUtils.responseNotFound('Campaign is not exist !');
      }

      const campaign = await CampaignModel.query().where('campaign_hash', '=', param.campaign_hash).first();
      if (!campaign) {
        return ErrorFactory.badRequest('Campaign not found!')
      }
      let value_paid = param.eth
      let type = Config.get('const.TokenPurchaseByEther')
      if (param.usdt && param.usdt != 0) {
        value_paid = param.usdt
        type = Config.get('const.TokenPurchaseByToken')
      }

      const newTransaction = new TransactionModel();
      newTransaction.transaction_hash = param.transaction_hash
      newTransaction.value_paid = value_paid
      newTransaction.amount_received = param.amount
      newTransaction.campaign_id = campaign.id
      newTransaction.purchaser = param.user_address
      newTransaction.type = type

      if (type == Config.get('const.TokenPurchaseByToken')) {
        newTransaction.symbol = 'USDT';
        newTransaction.name = 'Tether';
      }
      if (param.token) {
        newTransaction.token = param.token;
      }

      console.log('CREATE-TRANSACTION: TYPE:', type);
      console.log('CREATE-TRANSACTION: TRANSACTION:', newTransaction);

      await newTransaction.save()
      Event.fire('new:UpdateTotal', {newTransaction, param})
      return HelperUtils.responseSuccess(newTransaction)
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async transactionCreate({request}) {
    try {
      const param = request.all();
      console.log('transactionCreate with params: ', param);

      const tx = await web3.eth.getTransaction(param.txHash);
      if (tx == null)
        return ErrorFactory.badRequest('Transaction not found')
      const campaign = await CampaignModel.query().where('campaign_hash', '=', tx.to).first();
      if (!campaign) {
        return ErrorFactory.badRequest('Campaign not found!')
      }
      const blockHash = await web3.eth.getBlock(tx.blockNumber)
      const timestamp = blockHash.timestamp
      let decimals = Config.get('const.decimal_default');
      let decimals_reship = Config.get('const.decimal_default');
      let name = '';
      let symbol = '';
      const assetToken = new AssetTokenService();
      if (param.event == Config.get('const.event_by_token')) {
        const contract = new web3.eth.Contract(CONTRACT_ERC20_ABI, param.params.token);
        decimals = campaign.decimals
        decimals_reship = await contract.methods.decimals().call();
        name = await contract.methods.name().call();
        symbol = await contract.methods.symbol().call();
        await assetToken.createAsset(param.params.token, param.params.purchaser, symbol);
      }
      const campaign_total = new CampaignTotalService();
      await campaign_total.updateTotal(campaign.id, decimals, param)
      const transactionService = new TransactionService();
      const transaction = await transactionService.createTran(param, campaign.id, name, symbol, decimals_reship, decimals)
      if (param.event != Config.get('const.event_by_token')) {
        await assetToken.createAsset(campaign.token, param.params.purchaser, campaign.symbol);
      }
      Event.fire('new::revenue', {transaction, campaign_hash: campaign.campaign_hash, timestamp})
      return HelperUtils.responseSuccess(transaction);
    } catch (e) {
      console.error(e);
      return HelperUtils.responseErrorInternal('Error');
    }
  }

  async transactionList({request}) {
    try {
      const param = request.all();
      const limit = param.limit ? param.limit : Config.get('const.limit_default');
      const page = param.page ? param.page : Config.get('const.page_default');
      let listData = TransactionModel.query().orderBy('id', 'DESC')
      if (param.campaign) {
        const campaign = await CampaignModel.query().where('campaign_hash', '=', param.campaign).first()
        if (!campaign) {
          return ErrorFactory.notFound('Campaign not found!')
        }
        listData = listData.where('campaign_id', '=', campaign.id)
      }
      if (param.purchased_address) {
        listData = listData.where(function () {
          this.where('purchaser', 'like', '%' + param.purchased_address + '%')
            .orWhere('value_paid', 'like', param.purchased_address + '%')
            .orWhere('amount_received', 'like', param.purchased_address + '%')
        })
      }

      if (param.start_time && param.finish_time) {
        const startTime = moment.unix(param.start_time).format("YYYY-MM-DD H:m:s")
        const finishTime = moment.unix(param.finish_time).format("YYYY-MM-DD H:m:s")
        listData = listData.whereBetween('created_at', [startTime, finishTime])
      } else if (param.start_time) {
        const startTime = moment.unix(param.start_time).format("YYYY-MM-DD H:m:s")
        console.log(startTime)
        listData = listData.where('created_at', '>=', startTime)
      } else if (param.finish_time) {
        const finishTime = moment.unix(param.finish_time).format("YYYY-MM-DD H:m:s")
        listData = listData.where('created_at', '<=', finishTime)
      }

      listData = await listData.paginate(page, limit)
      return HelperUtils.responseSuccess(listData);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async transactionRefund({request}) {
    try {
      const param = request.all();
      const tx = await web3.eth.getTransaction(param.txHash);
      if (tx == null)
        return ErrorFactory.badRequest('Transaction not found')
      const campaign = await CampaignModel.query().where('campaign_hash', '=', tx.to).first();
      if (!campaign) {
        return ErrorFactory.badRequest('Campaign not found!')
      }
      const assetToken = new AssetTokenService();
      const decimals = campaign.decimals ? campaign.decimals : Config.get('const.decimal_default')
      await assetToken.createAsset(campaign.token, param.params.wallet, campaign.symbol);
      const campaign_total = new CampaignTotalService();
      await campaign_total.updateTotal(campaign.id, decimals, param)
      const transaction = new TransactionModel();
      transaction.purchaser = param.params.wallet;
      transaction.campaign_id = campaign.id;
      transaction.value_paid = 0;
      transaction.amount_received = new BigNumber(param.params.amount).dividedBy(Math.pow(10, decimals)).toFixed();
      transaction.transaction_hash = param.txHash;
      transaction.type = Config.get('const.' + param.event);
      await transaction.save();
      return HelperUtils.responseSuccess(transaction);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('Error');
    }
  }

  async latestTransaction() {
    try {
      const transaction = await TransactionModel.query().orderBy('created_at', 'desc').first();
      return HelperUtils.responseSuccess(transaction);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal();
    }
  }

  async tokenClaimed({request}) {
    try {
      const param = request.all();
      const tx = await web3.eth.getTransaction(param.txHash);
      if (tx == null)
        return ErrorFactory.badRequest('Transaction not found')
      const transactionService = new TransactionService();
      const checkTransaction = await transactionService.checkTransactionIsset(param.txHash)
      if (!checkTransaction) {
        return ErrorFactory.badRequest('Transaction already exist.')
      }
      const campaign = await CampaignModel.query().where('campaign_hash', '=', tx.to).first();
      if (!campaign) {
        return ErrorFactory.badRequest('Campaign not found!')
      }
      const transaction = new TransactionModel();
      transaction.transaction_hash = param.txHash
      transaction.campaign_id = campaign.id
      transaction.amount_received = new BigNumber(param.params.amount).dividedBy(Math.pow(10, Config.get('const.decimal_default'))).toFixed();
      transaction.beneficiary = param.params.wallet
      transaction.purchaser = param.params.wallet
      transaction.type = Config.get('const.TokenClaimed')
      await transaction.save();
      return HelperUtils.responseSuccess(transaction)
    } catch (e) {
      console.log(e.message);
      return HelperUtils.responseErrorInternal();
    }
  }
}

module.exports = TransactionController
