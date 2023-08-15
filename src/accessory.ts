import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
} from 'homebridge';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('EggTimerBulb', EggTimerBulb);
};

class EggTimerBulb implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly lightbulbService: Service;
  private readonly informationService: Service;
  private readonly interval: number;
  private brightness = 0;
  private timer: NodeJS.Timeout | undefined;

  constructor(log: Logging, config: AccessoryConfig) {
    this.log = log;
    this.interval = config.interval;

    this.lightbulbService = new hap.Service.Lightbulb(config.name);

    this.lightbulbService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this))
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this));

    this.lightbulbService.getCharacteristic(hap.Characteristic.Brightness)
      .on(CharacteristicEventTypes.GET, this.getBrightness.bind(this))
      .on(CharacteristicEventTypes.SET, this.setBrightness.bind(this));

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Egg Timer Bulb')
      .setCharacteristic(hap.Characteristic.Model, `${config.name} (${this.interval}ms)`);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.lightbulbService,
    ];
  }

  private getOn(callback: CharacteristicGetCallback): void {
    callback(undefined, this.brightness > 0);
  }

  private setOn(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!(value as boolean)) {
      this.log.info('Manually stopping timer.');
      this.updateBrightness(0);
    }
    callback();
  }

  private getBrightness(callback: CharacteristicGetCallback): void {
    callback(undefined, this.brightness);
  }

  private setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
    const brightness = value as number;
    this.updateBrightness(brightness);
    callback();
  }

  private updateBrightness(value: number): void {
    this.log.debug(`Brightness: ${this.brightness} -> ${value}`);
    this.brightness = Math.max(0, Math.min(100, value));
    this.lightbulbService.getCharacteristic(hap.Characteristic.Brightness).updateValue(this.brightness);
    this.lightbulbService.getCharacteristic(hap.Characteristic.On).updateValue(this.brightness > 0);
    if (this.brightness > 0 && this.timer === undefined) {
      this.log.info('Starting timer');
      this.timer = setInterval(() => this.updateBrightness(this.brightness - 1), this.interval);
    } else if (this.brightness === 0) {
      this.log.info('Timer completed.');
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
