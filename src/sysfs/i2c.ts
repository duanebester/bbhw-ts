// https://github.com/fivdi/i2c-bus

import type { I2CBus } from "i2c-bus";
import { openSync } from "i2c-bus";

export class I2C {
	bus: I2CBus;

	constructor(bus: number) {
		this.bus = openSync(bus);
	}

	tx(addr: number, write?: Buffer, read?: Buffer): number {
		let tx = 0;
		if (addr >= 0x400) {
			throw new Error("Invalid address");
		}
		if (write?.length === 0 && read?.length === 0) {
			return tx;
		}
		if (write && write.length > 0) {
			tx = this.bus.i2cWriteSync(addr, write.length, write);
		}
		if (read && read.length > 0) {
			tx = this.bus.i2cReadSync(addr, read.length, read);
		}
		return tx;
	}

	i2cReadSync(addr: number, length: number, read: Buffer): number {
		return this.bus.i2cReadSync(addr, length, read);
	}

	write(addr: number, write: Buffer): number {
		return this.tx(addr, write);
	}

	blockRead(addr: number, command: number, read: Buffer): number {
		return this.bus.readI2cBlockSync(addr, command, read.length, read);
	}

	close() {
		this.bus.closeSync();
	}
}
