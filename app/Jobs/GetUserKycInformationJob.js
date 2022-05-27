'use strict'

const kue = use('Kue');
const UserModel = use('App/Models/User')
const BlockpassApprovedModel = use('App/Models/BlockPassApproved');
const requests = require("request")
const Const = use('App/Common/Const');

const priority = 'medium'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 1; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class GetUserKycInformationJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return Const.JOB_KEY.GET_USER_KYC_INFOMATION
  }

  // This is where the work is done.
  async handle(data) {
    console.log('[GetUserKycInformationJob] GetUserKycInformationJob-job started')

    try {
      await GetUserKycInformationJob.doUpdateUserKycInformation()
    } catch (e) {
      console.log('[GetUserKycInformationJob] GetUserKycInformationJob has error', e)
      throw e;
    }
  }

  static async doUpdateUserKycInformation() {
    try {
      const url = process.env.BLOCK_PASS_API_URL.replace('CLIENT_ID', process.env.BLOCK_PASS_CLIENT_ID)
        .replace('recordId/RECORDID', 'applicants/approved')

      let _limit = 20
      let _total = 0
      let _page = 0

      do {
        if (!_total) {
          console.log(`[GetUserKycInformationJob] Fetching records of total unkown`)
        } else {
          console.log(`[GetUserKycInformationJob] Fetching records ${_page * _limit} - ${_total < (_page * _limit + _limit - 1) ? _total : (_page * _limit + _limit - 1)} of total ${_total}`)
        }

        const options = {
          url: url,
          method: 'GET',
          qs: {
            limit: _limit,
            skip: _page * _limit
          },
          headers: {
            'Authorization': process.env.BLOCK_PASS_API_KEY
          }
        }

        const response = await new Promise((resolve, reject) => {
          requests(options, function (error, response, body) {
            if (error) reject(error)
            else resolve(response)
          })
        })

        if (!response || response.statusCode !== 200) {
          throw `[GetUserKycInformationJob] Failed when fetching list kyc information from BlockPass`
        }

        const res = JSON.parse(response.body)

        if (!res || !res.data || !res.data.total) {
          throw `[GetUserKycInformationJob] Failed when fetching list kyc information from BlockPass`
        }

        if (!res.data.total) {
          throw `[GetUserKycInformationJob] No data when fetching list kyc information from BlockPass`
        }

        if (_total !== res.data.total) {
          _total = res.data.total
        }

        if (_limit !== res.data.limit) {
          _limit = res.data.limit
        }

        for (const el of res.data.records) {
          // get user info
          const email = el.identities.email.value;
          const wallet = el.identities.crypto_address_matic.value;
          const kycStatus = el.status;
          const address_country = JSON.parse(el.identities.address.value).country;
          let passport_issuing_country = address_country;

          if (el.identities.passport_issuing_country != null) {
            passport_issuing_country = el.identities.passport_issuing_country.value;
          } else if (el.identities.national_id_issuing_country != null) {
            passport_issuing_country = el.identities.national_id_issuing_country.value;
          } else if (el.driving_license_issuing_country != null) {
            passport_issuing_country = el.identities.driving_license_issuing_country.value;
          }

          if (!email || !wallet) {
            console.log(`Do not found user with email ${email} and wallet ${wallet}`);
            return HelperUtils.responseBadRequest();
          }

          let user = await UserModel
            .query()
            .where('wallet_address', el.identities.crypto_address_matic.value)
            .andWhere('email', el.identities.email.value)
            .first()

          // if (!user) {
          //   user = await UserModel.query().where('record_id', el.recordId).first()
          // }

          if (!user) {
            // console.log(`not found user `, email , ' - address ', el.identities.crypto_address_matic.value);
            user = new UserModel();
            user.fill({
              email,
              is_kyc: Const.KYC_STATUS.APPROVED,
              wallet_address: wallet,
              record_id: el.recordId,
              ref_id: el.refId,
              status: Const.USER_STATUS.ACTIVE,
              username: email,
              signature: email,
              national_id_issuing_country: passport_issuing_country,
              address_country: address_country
            });
            await user.save();
            continue;
          }

          if (user.record_id === el.recordId &&
            user.national_id_issuing_country === passport_issuing_country &&
            user.is_kyc == Const.KYC_STATUS.APPROVED &&
            user.address_country === address_country) {
            console.log('[GetUserKycInformationJob] Dont update user');
            continue
          }

          const userModel = new UserModel();
          userModel.fill({
            ...JSON.parse(JSON.stringify(user)),
            is_kyc: Const.KYC_STATUS[kycStatus.toString().toUpperCase()],
            record_id: el.recordId,
            ref_id: el.refId,
            national_id_issuing_country: passport_issuing_country,
            address_country: address_country
          });
          await UserModel.query().where('id', user.id).update(userModel);

          console.log(`[GetUserKycInformationJob] Updated user who has wallet: ${user.wallet_address}, email: ${user.email}`);
        }

        _page += 1
      } while (_page * _limit < _total)

      return

    } catch (e) {
      console.error(e);
      throw (e)
    }
  }

  // Dispatch
  static doDispatch(data) {
    console.log('[GetUserKycInformation] DISPATCH GETTING USER KYC INFOMATION NOW', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = GetUserKycInformationJob

