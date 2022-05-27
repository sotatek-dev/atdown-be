'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const Mail = use('Mail');
const Env = use('Env')

const priority = 'medium'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class SendForgotPasswordJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return Const.JOB_KEY.SEND_FORGOT_PASSWORD;
  }

  // This is where the work is done.
  async handle (data) {
    console.log('SendForgotPasswordJob-job started', data);
    const mailData = data;
    const from = Env.get('MAIL_FROM_ADDRESS')
    await Mail.send('resetPassword', mailData, (message) => {
      message
        .to(mailData.email)
        .from(from)
        .subject('Request password reset at RedKite.')
    }).catch(e => {
      console.log('ERROR Send Mail: ', e);
      throw e;
    });
  }

  // Dispatch
  static doDispatch(data) {
    console.log('Dispatch Send Mail NOW', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = SendForgotPasswordJob

