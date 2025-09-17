import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		tracker_active: {
			name: 'Tracker Active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'tracker_id',
					type: 'number',
					label: 'Tracker ID',
					default: 1,
					min: 0,
					max: 255,
				},
			],
			callback: (feedback) => {
				const trackerId = Number(feedback.options.tracker_id)
				const trackerValue = self.getVariableValue(`tracker_${trackerId}_name`)
				return trackerValue !== undefined && trackerValue !== ''
			},
		},
		connection_status: {
			name: 'Connection Status',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => {
				const trackerCount = self.getVariableValue('tracker_count')
				return trackerCount !== undefined && Number(trackerCount) > 0
			},
		},
	})
}
