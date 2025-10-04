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
				feedbacks: [],
			}
		}
	}
	self.setPresetDefinitions(presets)
}
