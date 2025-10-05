import type { ModuleInstance } from './main.js'
import { combineRgb } from '@companion-module/base'

export function UpdatePresets(self: ModuleInstance): void {
	const keys = self.currentTrackerList
	const presets: { [key: string]: any } = {}

	const targets = {
		pos: 'Position',
		speed: 'Speed',
		ori: 'Orientation',
		accel: 'Acceleration',
		trgtpos: 'Targetposition',
	}

	self.log('debug', `${keys}`)
	for (const type in targets) {
		const typeLabel = targets[type as keyof typeof targets]
		for (const i of keys) {
			presets[`${type}_${i}`] = {
				type: 'button',
				category: `${typeLabel}`,
				name: `Tracker ${i} ${typeLabel}`,
				style: {
					text: `$(psn:tracker_${i}_name)\n$(psn:tracker_${i}_${type}_x)\n$(psn:tracker_${i}_${type}_y)\n$(psn:tracker_${i}_${type}_z)`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
					show_topbar: false,
				},
				steps: [],
				feedbacks: [
					{
						feedbackId: 'tracker_moving',
						options: {
							tracker_id: `${i}`,
							tracker_type: 'speed',
							tracker_axis: 'y',
							fg: combineRgb(6, 80, 156),
							bg: combineRgb(0, 0, 0),
							fg_default: combineRgb(255, 255, 255),
							bg_default: combineRgb(0, 0, 0),
							fg_down: combineRgb(110, 210, 28),
							bg_down: combineRgb(0, 0, 0),
						},
					},
				],
			}
		}
	}
	presets[`Name`] = {
		type: 'button',
		category: `Status`,
		name: `Name`,
		style: {
			text: `$(psn:system_name)\n$(psn:system_tracker_count) Trackers`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
			show_topbar: false,
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'connection_status',
				options: {},
				style: {
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
			},
		],
	}

	presets[`packageRate`] = {
		type: 'button',
		category: `Status`,
		name: `Package Rate`,
		style: {
			text: `Rate:\n$(psn:system_packet_rate)s`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
			show_topbar: false,
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'connection_status',
				options: {},
				style: {
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
			},
		],
	}

	self.setPresetDefinitions(presets)
}
