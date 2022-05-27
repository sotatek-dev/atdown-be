const kue = use('Kue');
const Const = use('App/Common/Const');
const Common = use('App/Common/Common');
const CampaignService = use('App/Services/CampaignService');
const _ = require('lodash/core');
const Event = use('Event');

const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const Web3 = require('web3');
const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);

const LIMIT_TRY_NUMBER = 30;
let tryNumber = 0;
const priority = 'normal'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 1; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => {
  job.backoff();
}; // Function to be run on the job before it is saved

class CheckTxStatus {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 1;
  }

  constructor() {
    this.campaignService = new CampaignService();
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return Const.JOB_KEY.CHECK_STATUS;
  }

  // This is where the work is done.
  async handle(data) {
    console.log('CheckTxStatus-job started');
    console.log('Params:', data);

    const delayInMilliseconds = 300000; // 5 minutes
    try {
      const receipt = await web3.eth.getTransactionReceipt(data.txHash);
      if (receipt === null) {
        const pendingTx = await web3.eth.getTransaction(data.txHash);
        if (pendingTx == null) {
          if (tryNumber < LIMIT_TRY_NUMBER) {
            tryNumber++;
            console.log(`Tx ${data.txHash} seems to be DROPPED, Retry count: ${tryNumber}`);
            setTimeout(function() {
              CheckTxStatus.doDispatch(data);
            }, delayInMilliseconds);
          } else {
            tryNumber = 0;
            console.log(`Tx ${data.txHash} had result: DROPPED & REPLACED.`);
            await this._updateTxStatusFailed(data);
          }
        } else {
          console.log(`Tx ${data.txHash} had not have result yet.`);
          setTimeout(function() {
            CheckTxStatus.doDispatch(data);
          }, delayInMilliseconds);
        }
        return;
      }
      if (receipt.status) {
        console.log(`Tx ${data.txHash} had result: SUCCESS.`);
        await this._updateTxStatusSuccess(data);
      } else {
        console.log(`Tx ${data.txHash} had result: FAILED.`);
        await this._updateTxStatusFailed(data);
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
    console.log('CheckTxStatus-job ended');
  }

  async _updateTxStatusSuccess(data) {
    return await this.campaignService.updateTxStatusSuccess(data.txHash);
  }

  async _updateTxStatusFailed(data) {
    switch (data.txTable) {
      case Const.TX_TABLE.CAMPAIGN:
        if (data.action == Const.TX_UPDATE_ACTION.CAMPAIGN_REGISTER) {
          // TODO: Fire Event
          // const campaignData = {
          //   campaignId: data.id
          // };
          // console.log(`Fire event with campaign ID: ${data.id}`);
          // Event.fire('register::campaigns', campaignData);
        }
        if (data.action == Const.TX_UPDATE_ACTION.CAMPAIGN_UPDATE) {
          // TODO: Fire Event
          // const campaignData = {
          //   campaignId: data.id
          // };
          // console.log(`Fire event with campaign ID: ${data.id}`);
          // Event.fire('update::campaigns', campaignData);
        }
        return await this.campaignService.updateTxCampaignStatusFailed(data.txHash);
      default:
        Common.throwUnknownTxTableErr(data.txTable);
    }
  }

  // Dispatch
  static doDispatch(data) {
    Common.checkTxTableValid(data.txTable);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = CheckTxStatus;
