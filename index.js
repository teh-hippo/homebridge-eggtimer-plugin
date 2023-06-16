let Service;
let Characteristic;

function eggTimerBulb(log, config, api) {
  this.log = log;
  this.name = config.name;
  this.interval = Math.max(1, config.interval);
  this.brightness = 0;
  this.uuid = api.hap.uuid.generate(this.name);
}

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-eggtimer-plugin', 'EggTimerBulb', eggTimerBulb);
};

eggTimerBulb.prototype.getServices = function () {
    const informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'Egg Timer Bulb')
        .setCharacteristic(Characteristic.Model, `Interval-${this.interval}ms`)
        .setCharacteristic(Characteristic.SerialNumber, this.uuid);

    this.lightbulbService = new Service.Lightbulb(this.name);

    this.lightbulbService.getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));

    this.lightbulbService.getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    return [informationService, this.lightbulbService];
};

eggTimerBulb.prototype.getBrightness = function (callback) {
    callback(null, this.brightness);
};

eggTimerBulb.prototype.setBrightness = function (brightness, callback) {
  this.log(`[${this.name}] User updating the brightness: ${brightness} (currently: ${this.brightness})`);
  this.brightness = Math.min(100, brightness);
  this.lightbulbService.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
  clearInterval(this.timer);

  if (this.brightness <= 0) {
      this.log(`[${this.name}] Clearing a running timer`);
  } else if (this.brightness > 0) {
      this.log(`[${this.name}] Starting a timer from: ${this.brightness} (interval: ${this.interval})`);
      const intervalCallback = () => {
        this.log(`[${this.name}] Update: ${this.brightness} (currently: ${--this.brightness})`);
        this.lightbulbService.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
        this.lightbulbService.getCharacteristic(Characteristic.On).updateValue(this.brightness > 0);
        if (this.brightness <= 0) {
          this.log(`[${this.name}] Timer has completed`);
          this.brightness = 0;
          clearInterval(this.timer);
        }
      };

      this.timer = setInterval(intervalCallback.bind(this), this.interval);
    }

    callback();
};

eggTimerBulb.prototype.getOn = function (callback) {
  callback(null, this.brightness > 0);
};

eggTimerBulb.prototype.setOn = function (on, callback) {
  this.log(`[${this.name}] Attempt to set on to: ${on} (brightness: ${this.brightness})`);
  callback();
};
