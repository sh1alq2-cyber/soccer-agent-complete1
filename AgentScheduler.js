const cron = require('node-cron');
const AgentService = require('./AgentService');

class AgentScheduler {
  constructor() {
    this.schedule = process.env.AGENT_CRON_SCHEDULE || '0 */6 * * *'; // Every 6 hours
    this.task = null;
  }

  start() {
    if (this.task) return;
    global.logger?.info(`📅 Scheduler started: ${this.schedule}`);
    this.task = cron.schedule(this.schedule, () => {
      global.logger?.info('⏰ Scheduled agent cycle triggered');
      AgentService.runCycle();
    });
  }

  stop() {
    if (this.task) {
      this.task.destroy();
      this.task = null;
      global.logger?.info('📅 Scheduler stopped');
    }
  }
}

module.exports = AgentScheduler;
