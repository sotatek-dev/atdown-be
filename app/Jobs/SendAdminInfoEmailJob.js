'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const Mail = use('Mail');
const Env = use('Env')

const priority = 'critical'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class SendAdminInfoEmailJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return Const.JOB_KEY.SEND_ADMIN_INFO_EMAIL;
  }

  // This is where the work is done.
  async handle (data) {
    console.log('SendAdminInfoEmailJob-job started', data);
    const mailData = data;
    const from = Env.get('MAIL_FROM_ADDRESS');
    await Mail.send('adminInfo', mailData, (message) => {
      message
        .to(mailData.email)
        .from(from)
        .subject(`[RedKite] Verify your email.`)
        // .subject(`[${Env.get('APP_NAME')}] Verify your email.`)
    }).catch(e => {
      console.log('ERROR Send Mail: ', e);
      throw e;
    });

    // await Mail.send('confirmEmail', mailData, (message) => {
    //   message
    //     .to(mailData.email)
    //     .from(Env.get('MAIL_FROM'))
    //     .subject('[RedKite] Verify your account.')
    // });
  }

  // Dispatch
  static doDispatch(data) {
    console.log('Dispatch Send Mail SendAdminInfoEmailJob: ', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = SendAdminInfoEmailJob

