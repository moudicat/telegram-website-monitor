import * as request from 'request';
import * as events from 'events';
import config from '../config/';
import { read } from 'fs';

export default class Monitor extends events.EventEmitter implements IMonitor {
  private method: string;
  private website: string;
  private interval: number;
  private timer: number;

  constructor(opts: IMonitorOpts) {
    super();
    this.method = opts.method || config.settings.method;
    this.website = opts.website || config.settings.website;
    this.interval = opts.interval || config.settings.checkInterval;

    this.interval = this.interval * 60 * 1000; // min

    this.start();
  }

  private start() {
    if (!this.website) {
      this.emit('error', 'No website to monitor');
      return;
    }

    this.ping();

    this.timer = setInterval(this.ping.bind(this), this.interval);
  }

  private stop() {
    clearInterval(this.timer);
    this.timer = null;

    this.emit('stop', this.website);
  }

  public ping() {
    const self = this;
    let currentTime = Date.now();
    let options = {
      url: this.website,
      method: this.method
    };

    request(options, (err, res, body) => {
      let latency = Date.now() - currentTime;

      if (!err && res.statusCode === 200) {
        this.emit('ok', {
          website: this.website,
          latency
        });
      } else {
        this.emit('down', {err, res});
      }
    });
  }

}