import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

import {
  init,
  set,
  get,
  del
} from "node-persist";

import AsyncLock from "async-lock";

class EggTimerBulb implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly lightbulbService: Service;
  private readonly informationService: Service;
  private readonly occupancyService: Service | undefined;
  private readonly interval: number;
  private readonly hap: HAP;
  private readonly storageKey: string;
  private readonly storageDir: string;
  private readonly stateful: boolean;
  private readonly lock: AsyncLock;
  private brightness = 0;
  private timer: NodeJS.Timeout | undefined;
  private stateRestored: boolean;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.hap = api.hap;
    this.interval = Number(config.interval);
    this.stateRestored = false;

    this.lightbulbService = new this.hap.Service.Lightbulb(config.name);

    this.lightbulbService.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.lightbulbService.getCharacteristic(this.hap.Characteristic.Brightness)
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, "Egg Timer Bulb")
      .setCharacteristic(this.hap.Characteristic.Model, `${config.name} (${this.interval.toString()}ms)`);

    this.stateful = config.stateful === true;
    this.storageKey = `${config.name}-${this.interval.toString()}`;
    this.storageDir = api.user.persistPath();
    this.lock = new AsyncLock();

    if (config.occupancySensor === true) {
      this.occupancyService = new this.hap.Service.OccupancySensor(`${config.name} Active`);
      this.occupancyService.getCharacteristic(this.hap.Characteristic.OccupancyDetected)
        .onGet(this.getOccupancy.bind(this));
    }

    if (this.stateful) {
      this.restoreState().catch((error: unknown) => {
        this.log.error(String(error));
      });
    }
  }

  getServices(): Service[] {
    const services = [
      this.informationService,
      this.lightbulbService
    ];

    if (this.occupancyService) {
      services.push(this.occupancyService);
    }

    return services;
  }

  private async getOn(): Promise<boolean> {
    await this.restoreState();
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    if (!(value as boolean)) {
      this.log.info("Manually stopping timer.");
      await this.updateBrightness(0);
    }
  }

  private async getBrightness(): Promise<number> {
    await this.restoreState();
    return this.brightness;
  }

  private async setBrightness(value: CharacteristicValue): Promise<void> {
    const brightness = value as number;
    await this.updateBrightness(brightness);
  }

  private async getOccupancy(): Promise<boolean> {
    await this.restoreState();
    return this.brightness > 0;
  }

  private async updateBrightness(value: number): Promise<void> {
    this.log.debug(`Brightness: ${this.brightness.toString()} -> ${value.toString()}`);
    this.brightness = Math.max(0, Math.min(100, value));

    // Persist state
    if (this.stateful) {
      if (this.brightness > 0) {
        this.log.debug("Caching state");
        await set(this.storageKey, this.brightness);
      } else {
        this.log.debug("Deleting state");
        await del(this.storageKey);
      }
    }

    // Update HomeKit
    const isActive = this.brightness > 0;
    this.lightbulbService.updateCharacteristic(this.hap.Characteristic.Brightness, this.brightness);
    this.lightbulbService.updateCharacteristic(this.hap.Characteristic.On, isActive);
    if (this.occupancyService !== undefined) {
      this.occupancyService.updateCharacteristic(this.hap.Characteristic.OccupancyDetected, isActive);
    }

    // Update Timer
    if (isActive && this.timer === undefined) {
      this.log.info("Starting timer");
      this.timer = setInterval(() => {
        this.updateBrightness(this.brightness - 1).catch((error: unknown) => {
          this.log.error(String(error));
        });
      }, this.interval);
    } else if (this.brightness === 0) {
      this.log.info("Timer completed.");
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async restoreState(): Promise<void> {
    if (!this.stateful || this.stateRestored) {
      return;
    }

    await this.lock.acquire("restoreState", async () => {
      // Double-lock
      if (this.stateRestored) {
        return;
      }

      this.log.debug("Checking for stored state.");
      await init({
        expiredInterval: 1000 * 60 * 60 * 24 * 14, // Delete cached items after 14 days.
        forgiveParseErrors: true,
        dir: this.storageDir
      });

      const value = await get(this.storageKey) as number | undefined;
      if (value !== undefined && value > 0) {
        this.log.info(`Restoring state to: ${value.toString()}`);
        await this.updateBrightness(value);
      }

      this.stateRestored = true;
    });
  }
}

export = (api: API) => {
  api.registerAccessory("EggTimerBulb", EggTimerBulb);
};
