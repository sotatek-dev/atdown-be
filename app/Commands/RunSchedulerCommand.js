'use strict'

const { Command } = require('@adonisjs/ace');
const Scheduler = use('Adonis/Addons/Scheduler');

class RunSchedulerCommand extends Command {
  static get signature() {
    return `scheduler`;
  }

  static get description() {
    return 'Run scheduler';
  }

  async handle(args, options) {
    Scheduler.run();
  }
}

module.exports = RunSchedulerCommand;
