import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import * as dgram from 'dgram'
import type { RemoteInfo } from 'dgram'

// Protocol constants
const PSN_INFO_PACKET = 0x6756
const PSN_DATA_PACKET = 0x6755
const PSN_INFO_PACKET_HEADER = 0x0000
const PSN_INFO_SYSTEM_NAME = 0x0001
const PSN_INFO_TRACKER_LIST = 0x0002
const PSN_INFO_TRACKER_NAME = 0x0000
const PSN_DATA_PACKET_HEADER = 0x0000
const PSN_DATA_TRACKER_LIST = 0x0001
const PSN_DATA_TRACKER_POS = 0x0000
const PSN_DATA_TRACKER_SPEED = 0x0001
const PSN_DATA_TRACKER_ORI = 0x0002
const PSN_DATA_TRACKER_STATUS = 0x0003
const PSN_DATA_TRACKER_ACCEL = 0x0004
const PSN_DATA_TRACKER_TRGTPOS = 0x0005
const PSN_DATA_TRACKER_TIMESTAMP = 0x0006

// Removed unused TrackerInfo interface

interface TrackerData {
	id: number
	name?: string
	pos?: { x: number; y: number; z: number }
	speed?: { x: number; y: number; z: number }
	ori?: { x: number; y: number; z: number }
	validity?: number
	accel?: { x: number; y: number; z: number }
	trgtpos?: { x: number; y: number; z: number }
	timestamp?: bigint
}

interface ChunkHeader {
	id: number
	dataLen: number
	hasSubchunks: boolean
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()
	private socket?: dgram.Socket
	private trackers = new Map<number, TrackerData>()
	private systemName = ''

	constructor(internal: unknown) {
		super(internal)
	}

	/**
	 * Format a number rounded to at most 3 decimal places.
	 * - Returns '' for non-finite numbers
	 * - Trims trailing zeros (e.g., 1.2 not 1.200)
	 */
	private format3(value: number): string {
		if (!Number.isFinite(value)) return ''
		const rounded = Math.round(value * 1000) / 1000
		// Avoid "-0"
		if (Object.is(rounded, -0)) return '0'
		return String(rounded)
	}

	private isMulticastAddress(host: string): boolean {
		const parts = host.split('.')
		if (parts.length !== 4) return false
		const firstOctet = parseInt(parts[0], 10)
		return firstOctet >= 224 && firstOctet <= 239
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting, 'Initializing PosiStageNet connection...')

		await this.initConnection()

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		await this.closeConnection()
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		await this.closeConnection()
		await this.initConnection()
		// Rebuild variable definitions in case max_trackers changed
		this.updateVariableDefinitions()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	private async initConnection(): Promise<void> {
		try {
			this.log('info', `🚀 Initializing NATIVE PosiStageNet connection to ${this.config.host}:${this.config.port}`)

			this.socket = dgram.createSocket('udp4')

			this.socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
				this.handleMessage(msg, rinfo)
			})

			this.socket.on('error', (err: Error) => {
				this.log('error', `❌ UDP error: ${err.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			})

			this.socket.on('listening', () => {
				const address = this.socket!.address()
				this.log('info', `🎧 Successfully bound to ${address.address}:${address.port}`)

				// Join multicast group if the host is a multicast address
				if (this.isMulticastAddress(this.config.host)) {
					try {
						this.socket!.addMembership(this.config.host)
						this.log('info', `✅ Successfully joined multicast group ${this.config.host}`)
					} catch (error) {
						this.log('error', `❌ Failed to join multicast group ${this.config.host}: ${error}`)
						this.updateStatus(InstanceStatus.ConnectionFailure, `Multicast join failed: ${error}`)
						return
					}
				} else {
					this.log('info', `📡 ${this.config.host} is not a multicast address, listening for unicast`)
				}

				this.log('info', `🔊 Listening for PosiStageNet on ${this.config.host}:${this.config.port}`)
				this.updateStatus(InstanceStatus.Ok, 'Connected to PosiStageNet (Native)')
			})

			this.socket.on('close', () => {
				this.log('info', '🔌 UDP socket closed')
			})

			this.log('info', `🔗 Binding to port ${this.config.port}...`)
			this.socket.bind(this.config.port)
		} catch (error) {
			this.log('error', `❌ Failed to create UDP socket: ${error}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, `UDP socket error: ${error}`)
		}
	}

	private async closeConnection(): Promise<void> {
		if (this.socket) {
			// Leave multicast group before closing
			if (this.isMulticastAddress(this.config.host)) {
				try {
					this.socket.dropMembership(this.config.host)
					this.log('info', `📤 Left multicast group ${this.config.host}`)
				} catch (error) {
					this.log('warn', `⚠️ Failed to leave multicast group: ${error}`)
				}
			}

			this.socket.removeAllListeners()
			this.socket.close()
			this.socket = undefined
		}
		this.trackers.clear()
	}

	private handleMessage(buffer: Buffer, _rinfo: RemoteInfo): void {
		try {
			const chunks = this.parseChunks(buffer, 0, buffer.length)
			for (const chunk of chunks) {
				this.processChunk(chunk, buffer)
			}
		} catch (error) {
			this.log('error', `Failed to parse message: ${error}`)
		}
	}

	private parseChunks(buffer: Buffer, offset: number, length: number): Array<{ header: ChunkHeader; offset: number }> {
		const chunks: Array<{ header: ChunkHeader; offset: number }> = []
		const end = Math.min(buffer.length, offset + length)

		while (offset + 4 <= end) {
			const header = this.parseChunkHeader(buffer, offset)
			const dataStart = offset + 4
			const dataEnd = dataStart + header.dataLen
			if (dataEnd > end) {
				// Malformed or truncated chunk, stop parsing within this region
				break
			}
			chunks.push({ header, offset: dataStart })
			offset = dataEnd
		}

		return chunks
	}

	private parseChunkHeader(buffer: Buffer, offset: number): ChunkHeader {
		const headerValue = buffer.readUInt32LE(offset)
		return {
			id: headerValue & 0xffff,
			dataLen: (headerValue >> 16) & 0x7fff,
			hasSubchunks: headerValue >> 31 === 1,
		}
	}

	private processChunk(chunk: { header: ChunkHeader; offset: number }, buffer: Buffer): void {
		const { header, offset } = chunk

		switch (header.id) {
			case PSN_INFO_PACKET:
				this.processInfoPacket(buffer, offset, header.dataLen)
				break
			case PSN_DATA_PACKET:
				this.processDataPacket(buffer, offset, header.dataLen)
				break
			default:
				// Unknown chunk, ignore as per protocol spec
				break
		}
	}

	private processInfoPacket(buffer: Buffer, offset: number, length: number): void {
		const chunks = this.parseChunks(buffer, offset, length)

		for (const chunk of chunks) {
			switch (chunk.header.id) {
				case PSN_INFO_PACKET_HEADER:
					// Skip header processing for now
					break
				case PSN_INFO_SYSTEM_NAME: {
					const newSystemName = buffer.toString('utf8', chunk.offset, chunk.offset + chunk.header.dataLen)
					if (this.systemName !== newSystemName) {
						this.systemName = newSystemName
						this.log('info', `PSN System: ${this.systemName}`)
					}
					break
				}
				case PSN_INFO_TRACKER_LIST:
					this.processTrackerList(buffer, chunk.offset, chunk.header.dataLen, true)
					break
			}
		}
	}

	private processDataPacket(buffer: Buffer, offset: number, length: number): void {
		const chunks = this.parseChunks(buffer, offset, length)

		for (const chunk of chunks) {
			switch (chunk.header.id) {
				case PSN_DATA_PACKET_HEADER:
					// Skip header processing for now
					break
				case PSN_DATA_TRACKER_LIST:
					this.processTrackerList(buffer, chunk.offset, chunk.header.dataLen, false)
					break
			}
		}
	}

	private processTrackerList(buffer: Buffer, offset: number, length: number, isInfo: boolean): void {
		const chunks = this.parseChunks(buffer, offset, length)

		for (const chunk of chunks) {
			const trackerId = chunk.header.id

			if (!this.trackers.has(trackerId)) {
				this.trackers.set(trackerId, { id: trackerId })
			}

			const tracker = this.trackers.get(trackerId)!

			if (isInfo) {
				this.processTrackerInfo(tracker, buffer, chunk.offset, chunk.header.dataLen)
			} else {
				this.processTrackerData(tracker, buffer, chunk.offset, chunk.header.dataLen)
			}
		}

		this.updateTrackerVariables()
	}

	private processTrackerInfo(tracker: TrackerData, buffer: Buffer, offset: number, length: number): void {
		const chunks = this.parseChunks(buffer, offset, length)

		for (const chunk of chunks) {
			switch (chunk.header.id) {
				case PSN_INFO_TRACKER_NAME:
					tracker.name = buffer.toString('utf8', chunk.offset, chunk.offset + chunk.header.dataLen)
					break
			}
		}
	}

	private processTrackerData(tracker: TrackerData, buffer: Buffer, offset: number, length: number): void {
		const chunks = this.parseChunks(buffer, offset, length)

		for (const chunk of chunks) {
			switch (chunk.header.id) {
				case PSN_DATA_TRACKER_POS:
					if (chunk.header.dataLen >= 12) {
						tracker.pos = {
							x: buffer.readFloatLE(chunk.offset),
							y: buffer.readFloatLE(chunk.offset + 4),
							z: buffer.readFloatLE(chunk.offset + 8),
						}
					}
					break
				case PSN_DATA_TRACKER_SPEED:
					if (chunk.header.dataLen >= 12) {
						tracker.speed = {
							x: buffer.readFloatLE(chunk.offset),
							y: buffer.readFloatLE(chunk.offset + 4),
							z: buffer.readFloatLE(chunk.offset + 8),
						}
					}
					break
				case PSN_DATA_TRACKER_ORI:
					if (chunk.header.dataLen >= 12) {
						tracker.ori = {
							x: buffer.readFloatLE(chunk.offset),
							y: buffer.readFloatLE(chunk.offset + 4),
							z: buffer.readFloatLE(chunk.offset + 8),
						}
					}
					break
				case PSN_DATA_TRACKER_STATUS:
					if (chunk.header.dataLen >= 4) {
						tracker.validity = buffer.readFloatLE(chunk.offset)
					}
					break
				case PSN_DATA_TRACKER_ACCEL:
					if (chunk.header.dataLen >= 12) {
						tracker.accel = {
							x: buffer.readFloatLE(chunk.offset),
							y: buffer.readFloatLE(chunk.offset + 4),
							z: buffer.readFloatLE(chunk.offset + 8),
						}
					}
					break
				case PSN_DATA_TRACKER_TRGTPOS:
					if (chunk.header.dataLen >= 12) {
						tracker.trgtpos = {
							x: buffer.readFloatLE(chunk.offset),
							y: buffer.readFloatLE(chunk.offset + 4),
							z: buffer.readFloatLE(chunk.offset + 8),
						}
					}
					break
				case PSN_DATA_TRACKER_TIMESTAMP:
					if (chunk.header.dataLen >= 8) {
						tracker.timestamp = buffer.readBigUInt64LE(chunk.offset)
					}
					break
			}
		}
	}

	private updateTrackerVariables(): void {
		const variableValues: Record<string, string | number | boolean> = {}

		// Update system variables
		variableValues['system_name'] = this.systemName
		variableValues['tracker_count'] = this.trackers.size

		// Respect configured max trackers
		const max = Math.max(1, Math.min(255, this.config.max_trackers ?? 6))
		const trackersSorted = Array.from(this.trackers.values())
			.sort((a, b) => a.id - b.id)
			.slice(0, max)
		for (const tracker of trackersSorted) {
			const prefix = `tracker_${tracker.id}_`

			if (tracker.name !== undefined) {
				variableValues[`${prefix}name`] = tracker.name
			}

			if (tracker.pos) {
				variableValues[`${prefix}pos_x`] = this.format3(tracker.pos.x)
				variableValues[`${prefix}pos_y`] = this.format3(tracker.pos.y)
				variableValues[`${prefix}pos_z`] = this.format3(tracker.pos.z)
			}

			if (tracker.speed) {
				variableValues[`${prefix}speed_x`] = this.format3(tracker.speed.x)
				variableValues[`${prefix}speed_y`] = this.format3(tracker.speed.y)
				variableValues[`${prefix}speed_z`] = this.format3(tracker.speed.z)
			}

			if (tracker.ori) {
				variableValues[`${prefix}ori_x`] = this.format3(tracker.ori.x)
				variableValues[`${prefix}ori_y`] = this.format3(tracker.ori.y)
				variableValues[`${prefix}ori_z`] = this.format3(tracker.ori.z)
			}

			if (tracker.validity !== undefined) {
				variableValues[`${prefix}validity`] = this.format3(tracker.validity)
			}

			if (tracker.accel) {
				variableValues[`${prefix}accel_x`] = this.format3(tracker.accel.x)
				variableValues[`${prefix}accel_y`] = this.format3(tracker.accel.y)
				variableValues[`${prefix}accel_z`] = this.format3(tracker.accel.z)
			}

			if (tracker.trgtpos) {
				variableValues[`${prefix}trgtpos_x`] = this.format3(tracker.trgtpos.x)
				variableValues[`${prefix}trgtpos_y`] = this.format3(tracker.trgtpos.y)
				variableValues[`${prefix}trgtpos_z`] = this.format3(tracker.trgtpos.z)
			}

			if (tracker.timestamp !== undefined) {
				variableValues[`${prefix}timestamp`] = Number(tracker.timestamp)
			}
		}

		this.setVariableValues(variableValues)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
