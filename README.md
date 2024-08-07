![node](https://img.shields.io/node/v/homebridge-eggtimer-plugin)
[![npm](https://img.shields.io/npm/dt/homebridge-eggtimer-plugin.svg)](https://www.npmjs.com/package/homebridge-eggtimer-plugin)
[![npm version](https://badge.fury.io/js/homebridge-eggtimer-plugin.svg)](https://badge.fury.io/js/homebridge-eggtimer-plugin)
![Node.js CI](https://github.com/teh-hippo/homebridge-eggtimer-plugin/workflows/Node.js%20CI/badge.svg)

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

# Homebridge Egg Timer Plugin

Example config.json:

```json
    "accessories": [
        {
            "name": "Timer Bulb 1",
            "interval": 60000,
            "stateful": false,
            "occupancySensor": false,
            "accessory": "EggTimerBulb",
        },
    ]
```

This plugin will create a fake bulb that provides an everyday egg-timer for automations.
Brightness is used as an indicator of the time remaining and can be adjusted after the time has started.
When turned, the brightness will be decremented at set intervals (per minute by default).
HomeKit automations can be triggered based on the timer commencing (bulb on) and on completion (bulb off).

Unlike [homebridge-delay-switch](https://github.com/nitaybz/homebridge-delay-switch), the timer length is provided each time - similar to a real-world egg timer.

This was created originally created to help with kids' bedtime routines, where nightlights would be turned off automatically after an allowed amount of reading time (call me crazy, its 2023).

Other example usages found since:

* Automating a desk heater for bursts of heat in the winter.
* Running our air-con for a while and having it turn off automatically.

## Parameters

| Parameter | Description | Default |
| --------- | ----- | ------- |
| `interval`| How often to decrement the brightness. | `60000` (1 minute) |
| `stateful`| Persist the timer state between restarts. | `false` |
| `occupancySensor`| Add an occupancy sensor that reflects the timer's current state. | `false` |

## Development

The below `config.json` can be placed in `~/.homebridge/config.json`, or extend local ones.
Then use `pnpm link; pnpm debug` to validate.

```json
{
    "bridge": {
        "pin": "123-45-679",
        "port": 51761,
        "name": "Homebridge Test",
        "username": "0E:BD:3C:CC:A7:E1"
    },
    "accessories": [
        {
            "name": "Simple",
            "interval": 5000,
            "occupancySensor": false,
            "accessory": "EggTimerBulb"
        },
        {
            "name": "Occupancy",
            "interval": 1000,
            "occupancySensor": true,
            "accessory": "EggTimerBulb"
        },
        {
            "name": "Stateful",
            "interval": 10000,
            "accessory": "EggTimerBulb",
            "stateful": true
        },
        {
            "name": "StatefulOccupancy",
            "interval": 1000,
            "occupancySensor": true,
            "accessory": "EggTimerBulb",
            "stateful": true
        }
    ]
}

```