import { existsSync, writeFileSync, statSync, readFileSync, truncateSync, } from "fs"
import { join } from "path"
import { msleep } from "../utils/utils"

export type PwmChip = {
    chip: number
    pwm: number
}

export type PwmFreqValue = {
    frequency: number
    value: number
}

const pinToPwmChipMap: Map<string, PwmChip> = new Map()
pinToPwmChipMap.set("P9_22", { chip: 3, pwm: 0 }) //EHRPWM0A
pinToPwmChipMap.set("P9_31", { chip: 3, pwm: 0 }) //EHRPWM0A //same as P9_22
pinToPwmChipMap.set("P9_21", { chip: 3, pwm: 1 }) //EHRPWM0B
pinToPwmChipMap.set("P9_29", { chip: 3, pwm: 1 }) //EHRPWM0B //same as P9_21

pinToPwmChipMap.set("P9_14", { chip: 5, pwm: 0 }) //EHRPWM1A
pinToPwmChipMap.set("P8_36", { chip: 5, pwm: 0 }) //EHRPWM1A //same as P9_14
pinToPwmChipMap.set("P9_16", { chip: 5, pwm: 1 }) //EHRPWM1B
pinToPwmChipMap.set("P8_34", { chip: 5, pwm: 1 }) //EHRPWM1B //same as P9_16

pinToPwmChipMap.set("P8_19", { chip: 7, pwm: 0 }) //EHRPWM2A
pinToPwmChipMap.set("P8_45", { chip: 7, pwm: 0 }) //EHRPWM2A // same as P8_19
pinToPwmChipMap.set("P8_13", { chip: 7, pwm: 1 }) //EHRPWM2B
pinToPwmChipMap.set("P8_46", { chip: 7, pwm: 1 }) //EHRPWM2B // same as P8_13

pinToPwmChipMap.set("P9_42", { chip: 0, pwm: 0 }) //ECAPPWM0
pinToPwmChipMap.set("P9_28", { chip: 2, pwm: 0 }) //ECAPPWM2

export class PWM {
    pwmChip: PwmChip
    pwmPath: string

    constructor(pin: string) {
        if (!pinToPwmChipMap.has(pin)) {
            throw new Error(`Bad PWM pin, needs to be something like: ${pinToPwmChipMap.keys().next().value}`)
        }
        this.pwmChip = pinToPwmChipMap.get(pin)!
        let pwmChipPath = this._findPwmChipDir()
        if (!pwmChipPath) {
            throw new Error(`Unable to find pwm chip directory for chip id ${this.pwmChip.chip}`)
        }
        let pwmPath = join(pwmChipPath, `pwm${this.pwmChip.pwm}`)
        if (!existsSync(pwmPath)) {
            this._export(pwmChipPath)
        }
        this.pwmPath = pwmPath
        this.setPwmFrequencyAndValue({ frequency: 2000, value: 0 })
        this.enable()
        this.setPolarity("normal")
    }

    _findPwmChipDir(): string | undefined {
        let chipdir = `/sys/class/pwm/pwmchip${this.pwmChip.chip}/`
        let stats = statSync(chipdir)
        if (stats && stats.isDirectory()) {
            return chipdir
        }
        return undefined
    }

    _export(pwmChipPath: string) {
        let exportPath = join(pwmChipPath, 'export')
        let pwmPath = join(pwmChipPath, `pwm${this.pwmChip.pwm}`)
        writeFileSync(exportPath, this.pwmChip.pwm.toString())
        let count = 0
        let limit = 20
        while (!existsSync(pwmPath)) {
            msleep(50)
            count++
            if (count >= limit) {
                throw new Error(`Failed to export pwm: ${this.pwmChip}`)
            }
        }
    }

    enable() {
        writeFileSync(join(this.pwmPath, 'enable'), "1")
    }

    disable() {
        truncateSync(join(this.pwmPath, 'duty_cycle'), 0)
        writeFileSync(join(this.pwmPath, 'duty_cycle'), "0")
        writeFileSync(join(this.pwmPath, 'enable'), "0")
    }

    setPolarity(polarity: "normal" | "inversed") {
        truncateSync(join(this.pwmPath, 'polarity'), 0)
        writeFileSync(join(this.pwmPath, 'polarity'), polarity)
    }

    setPwmFrequencyAndValue({ frequency, value }: PwmFreqValue) {
        let period = Math.round(1.0e9 / frequency) // period in ns
        let duty = Math.round(period * value)
        writeFileSync(join(this.pwmPath, 'period'), period.toString())
        writeFileSync(join(this.pwmPath, 'duty_cycle'), "0")
        writeFileSync(join(this.pwmPath, 'duty_cycle'), duty.toString())
    }

    getPwmFrequencyAndValue(): PwmFreqValue {
        let periodStr = readFileSync(join(this.pwmPath, 'period')).toString("utf-8")
        let dutyStr = readFileSync(join(this.pwmPath, 'duty_cycle')).toString("utf-8")
        let period = parseInt(periodStr, 10)
        let duty = parseInt(dutyStr, 10)
        let frequency = 1.0e9 / period
        let value = duty / period
        return { frequency, value }
    }
}