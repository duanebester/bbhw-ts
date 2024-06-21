### Setup

Need to have [i2c-bus](https://github.com/fivdi/i2c-bus) library installed in your `NODE_PATH` on the beaglebone black.

```bash
sudo apt-get install nodejs npm
export NODE_PATH=/usr/local/lib/node_modules
npm i i2c-bus
```

Need to have pins configured in their respective modes before using...

Example:
```bash
#!/bin/sh
config-pin P9_11 gpio
config-pin P9_13 gpio
config-pin P9_17 i2c
config-pin P9_18 i2c
config-pin P9_19 i2c
config-pin P9_20 i2c
config-pin P9_22 pwm
config-pin P9_42 pwm
echo ds1338 0x68 | sudo tee /sys/class/i2c-adapter/i2c-1/new_device
sudo hwclock -w -f /dev/rtc1
```

### Example program

```ts
import { Direction, GPIO } from "bbhw-ts"
import { I2C } from "bbhw-ts"
import { PWM } from "bbhw-ts"
import { msleep } from "bbhw-ts"

export const POWERMON_ADDR = 0x21
export const MAX11614_ADDR = 0x33

let gpioLED = new GPIO(60, Direction.OUT)
let userButton = new GPIO(72, Direction.IN)
let i2cDevice1 = new I2C(1)
let pwm = new PWM("P9_22")

// Set PWM 
pwm.setPwmFrequencyAndValue({ frequency: 5000, value: 0.75 })

// GPIO in/out
while(true) {
    let button = userButton.getValue()
    console.log({ button })
    gpioLED.setValue(1)
    msleep(500)
    gpioLED.setValue(0)
    msleep(500)
}

// Reading the power info from MAX chip:
const wbuf = Buffer.from([0x8A, 0x0F]);
const rbuf = Buffer.alloc(2);
i2cDevice1.tx(MAX11614_ADDR, wbuf, rbuf)
console.log(`Max Chip setup block read response: ${rbuf[0]}, ${rbuf[1]}`)
while(true) {
    let powerRead = Buffer.alloc(16);
    i2cDevice1.tx(MAX11614_ADDR, undefined, powerRead)
    console.log(powerRead[0])
    console.log(powerRead[1])
    console.log(powerRead[2])
    console.log(powerRead[3])
    console.log(powerRead[4])
    console.log(powerRead[5])
    console.log(powerRead[6])
    console.log(powerRead[7])
    console.log(powerRead[8])
    console.log(powerRead[9])
    console.log(powerRead[10])
    console.log(powerRead[11])
    console.log(powerRead[12])
    console.log(powerRead[13])
    console.log(powerRead[14])
    console.log(powerRead[15])
    msleep(1000)
}
```
