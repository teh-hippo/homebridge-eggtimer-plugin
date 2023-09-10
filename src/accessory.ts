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

export = (api: API) => {
  api.registerAccessory('EggTimerBulb', EggTimerBulb);
};

class EggTimerBulb implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly lightbulbService: Service;
  private readonly informationService: Service;
  private readonly occupancyService: Service | undefined;
  private readonly interval: number;
  private readonly hap: HAP;
  private brightness = 0;
  private timer: NodeJS.Timeout | undefined;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.hap = api.hap;
    this.interval = config.interval;

    this.lightbulbService = new this.hap.Service.Lightbulb(config.name);

    this.lightbulbService.getCharacteristic(this.hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this))
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this));

    this.lightbulbService.getCharacteristic(this.hap.Characteristic.Brightness)
      .on(CharacteristicEventTypes.GET, this.getBrightness.bind(this))
      .on(CharacteristicEventTypes.SET, this.setBrightness.bind(this));

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Egg Timer Bulb')
      .setCharacteristic(this.hap.Characteristic.Model, `${config.name} (${this.interval}ms)`);

    if(config.occupancySensor === true) {
      this.occupancyService = new this.hap.Service.OccupancySensor(`${config.name} Active`);
      this.occupancyService.getCharacteristic(this.hap.Characteristic.OccupancyDetected)
        .on(CharacteristicEventTypes.GET, this.getOccupancy.bind(this));
    }
  }

  getServices(): Service[] {
    const services = [
      this.informationService,
      this.lightbulbService,
    ];

    if (this.occupancyService) {
      services.push(this.occupancyService);
    }

    return services;
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

  private getOccupancy(callback: CharacteristicGetCallback): void {
    callback(undefined, this.brightness > 0);
  }

  private updateBrightness(value: number): void {
    this.log.debug(`Brightness: ${this.brightness} -> ${value}`);
    this.brightness = Math.max(0, Math.min(100, value));
    this.lightbulbService.getCharacteristic(this.hap.Characteristic.Brightness).updateValue(this.brightness);
    this.lightbulbService.getCharacteristic(this.hap.Characteristic.On).updateValue(this.brightness > 0);
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
