import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { msleep } from "../utils/utils.js";

export enum Direction {
	IN = "in",
	OUT = "out",
	LOW = "low",
	HIGH = "high",
}

export class GPIO {
	pin: number;
	direction: Direction;

	constructor(pin: number, direction: Direction) {
		this.pin = pin;
		this.direction = direction;
		if (!existsSync(`/sys/class/gpio/gpio${this.pin}`)) {
			this.export();
		}
		this.setDirection(direction);
	}

	export() {
		writeFileSync("/sys/class/gpio/export", this.pin.toString());
		let count = 0;
		const limit = 20;
		while (!existsSync(`/sys/class/gpio/gpio${this.pin}`)) {
			msleep(50);
			count++;
			if (count >= limit) {
				throw new Error(`Failed to export pin number ${this.pin}`);
			}
		}
	}

	unexport() {
		writeFileSync("/sys/class/gpio/unexport", this.pin.toString());
	}

	setDirection(direction: Direction) {
		this.direction = direction;
		writeFileSync(`/sys/class/gpio/gpio${this.pin}/direction`, this.direction);
	}

	getDirection(): Direction {
		const buffer = readFileSync(`/sys/class/gpio/gpio${this.pin}/direction`);
		const str = buffer.toString("utf-8");
		return str as Direction;
	}

	setValue(value: number) {
		writeFileSync(`/sys/class/gpio/gpio${this.pin}/value`, value.toString());
	}

	getValue(): number {
		const buffer = readFileSync(`/sys/class/gpio/gpio${this.pin}/value`);
		const str = buffer.toString("utf-8");
		const value = Number.parseInt(str, 10);
		return value;
	}

	setActiveLow(activeLow: boolean) {
		if (activeLow)
			writeFileSync(`/sys/class/gpio/gpio${this.pin}/active_low`, "1");
		else writeFileSync(`/sys/class/gpio/gpio${this.pin}/active_low`, "0");
	}
}
