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

import {
  init,
  set,
  get,
  del,
} from 'node-persist';

import AsyncLock from 'async-lock';

class EggTimerBulb implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly lightbulbService: Service;
  private readonly informationService: Service;
  private readonly occupancyService: Service | undefined;
  private readonly interval: number;
  private readonly hap: HAP;
  private readonly storageKey: string;
  private readonly storageDir: string;
  private readonly stateful : boolean;
  private readonly lock : AsyncLock;
  private brightness = 0;
  private timer: NodeJS.Timeout | undefined;
  private stateRestored: boolean;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.hap = api.hap;
    this.interval = config.interval;
    this.stateRestored = false;

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

    this.stateful = config.stateful === true;
    this.storageKey = `${config.name}-${config.interval}`;
    this.storageDir = api.user.persistPath();
    this.lock = new AsyncLock();

    if(config.occupancySensor === true) {
      this.occupancyService = new this.hap.Service.OccupancySensor(`${config.name} Active`);
      this.occupancyService.getCharacteristic(this.hap.Characteristic.OccupancyDetected)
        .on(CharacteristicEventTypes.GET, this.getOccupancy.bind(this));
    }

    if (this.stateful) {
      this.restoreState();
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

  private async getOn(callback: CharacteristicGetCallback): Promise<void> {
    await this.restoreState();
    callback(undefined, this.brightness > 0);
  }

  private async setOn(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void> {
    if (!(value as boolean)) {
      this.log.info('Manually stopping timer.');
      await this.updateBrightness(0);
    }
    callback();
  }

  private async getBrightness(callback: CharacteristicGetCallback): Promise<void> {
    await this.restoreState();
    callback(undefined, this.brightness);
  }

  private async setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void> {
    const brightness = value as number;
    await this.updateBrightness(brightness);
    callback();
  }

  private getOccupancy(callback: CharacteristicGetCallback): void {
    callback(undefined, this.brightness > 0);
  }

  private async updateBrightness(value: number): Promise<void> {
    this.log.debug(`Brightness: ${this.brightness} -> ${value}`);
    this.brightness = Math.max(0, Math.min(100, value));

    // Persist state
    if (this.stateful) {
      if (this.brightness > 0) {
        this.log.debug('Caching state');
        await set(this.storageKey, this.brightness);
      } else {
        this.log.debug('Deleting state');
        await del(this.storageKey);
      }
    }

    // Update HomeKit
    this.lightbulbService.getCharacteristic(this.hap.Characteristic.Brightness).updateValue(this.brightness);
    this.lightbulbService.getCharacteristic(this.hap.Characteristic.On).updateValue(this.brightness > 0);

    // Update Timer
    if (this.brightness > 0 && this.timer === undefined) {
      this.log.info('Starting timer');
      this.timer = setInterval(async () => await this.updateBrightness(this.brightness - 1), this.interval);
    } else if (this.brightness === 0) {
      this.log.info('Timer completed.');
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async restoreState(): Promise<void> {
    if (!this.stateful || this.stateRestored) {
      return;
    }

    await this.lock.acquire('restoreState', async () => {
      // Double-lock
      if (this.stateRestored) {
        return;
      }

      this.log.debug('Checking for stored state.');
      await init( {
        expiredInterval: 1000 * 60 * 60 * 24 * 14, // Delete cached items after 14 days.
        forgiveParseErrors: true,
        dir: this.storageDir,
      });

      const value = await get(this.storageKey) as number;
      if (value !== undefined && value > 0) {
        this.log.info(`Restoring state to: ${value}`);
        this.updateBrightness(value);
      }

      this.stateRestored = true;
    });
  }
}

export = (api: API) => {
  api.registerAccessory('EggTimerBulb', EggTimerBulb);
};