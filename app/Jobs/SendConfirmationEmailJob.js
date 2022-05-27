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

class SendConfirmationEmailJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return Const.JOB_KEY.SEND_CONFIRMATION_EMAIL;
  }

  // This is where the work is done.
  async handle (data) {
    console.log('SendConfirmationEmailJob-job started', data);
    const mailData = data;
    const from = Env.get('MAIL_FROM_ADDRESS');

    const subject = '[RedKite] Verify your email.';
    console.log('Sending Email with Subject: ', subject);
    await Mail.send('confirmEmail', mailData, (message) => {
      message
        .to(mailData.email)
        .from(from)
        .subject(subject)
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
    console.log('Dispatch Send Mail SendConfirmationEmailJob: ', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = SendConfirmationEmailJob

