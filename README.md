# Homebridge Egg Timer Plugin

Example config.json:

```json
    "accessories": [
        {
            "name": "AirconHeat",
            "interval": 60000,
            "accessory": "TimerBulb"
        }
    ]
```

This plugin will create a fake bulb that provides an everyday egg-timer for automations.  Brightness is used as an indicator of the time remaining and can be adjusted after the time has started.  When turned, the brightness will be decremented at set intervals (per minute by default).  HomeKit automations can be triggered based on the timer commencing (bulb on) and on completion (bulb off).

Different to [homebridge-delay-switch](https://github.com/nitaybz/homebridge-delay-switch) is that the timer quantity is provided each time; similar to a real-world egg timer.  Sensors are also not used.

This was created originally created to help with kids' bedtime routines, where nightlights would be turned off automatically after an allowed amount of reading time (call me crazy, its 2023).

Other example usages found since:
* Automating a desk heater for bursts of heat in the winter.
* Running our aircon for a while and having it turn off automatically.


## Parameters

| Parameter | Description | Default |
| --------- | ----- | ------- |
| `interval`| How often to decrement the brightness. | `60000` (1 minute) |