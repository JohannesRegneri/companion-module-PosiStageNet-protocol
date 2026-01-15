import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

const ColorWhite = combineRgb(255, 255, 255)
const ColorGray = combineRgb(72, 72, 72)
const ColorBlack = combineRgb(0, 0, 0)
const ColorRed = combineRgb(200, 0, 0)
const ColorGreen = combineRgb(0, 200, 0)
const ColorOrange = combineRgb(255, 102, 0)
const ColorUp = combineRgb(6, 80, 156)
const ColorTrack = combineRgb(190, 60, 175)
const ColorDown = combineRgb(110, 210, 28)

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		tracker_active: {
			name: 'Tracker Active',
			description: '',
			type: 'boolean',
			defaultStyle: {
				bgcolor: ColorOrange,
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'tracker_id',
					type: 'number',
					label: 'Tracker ID',
					default: 1,
					min: 0,
					max: 4294967295,
				},
			],
			callback: (feedback) => {
				const trackerId = Number(feedback.options.tracker_id)
				const trackerValue = self.getVariableValue(`tracker_${trackerId}_name`)
				return trackerValue !== undefined && trackerValue !== ''
			},
		},
		tracker_moving: {
			name: 'Tracker Moving',
			description: "Changes the button's style when the value is below or above 0.",
			type: 'advanced',
			options: [
				{
					id: 'tracker_id',
					type: 'number',
					label: 'Tracker ID',
					default: 1,
					min: 0,
					max: 4294967295,
				},
				{
					id: 'tracker_type',
					type: 'dropdown',
					label: 'Type',
					default: 'speed',
					choices: [
						{ id: 'pos', label: 'Position' },
						{ id: 'speed', label: 'Speed' },
						{ id: 'ori', label: 'Orientation' },
						{ id: 'accel', label: 'Acceleration' },
						{ id: 'trgtpos', label: 'Targetposition' },
					],
					isVisible: () => true,
				},
				{
					id: 'tracker_axis',
					type: 'dropdown',
					label: 'Axis',
					default: 'y',
					choices: [
						{ id: 'x', label: 'x-axis' },
						{ id: 'y', label: 'y-axis' },
						{ id: 'z', label: 'z-axis' },
					],
					isVisible: () => true,
				},
				{
					type: 'colorpicker',
					label: 'Foreground color (Up)',
					id: 'fg',
					default: ColorUp,
				},
				{
					type: 'colorpicker',
					label: 'Background color (Up)',
					id: 'bg',
					default: ColorBlack,
					isVisible: () => false,
				},
				{
					type: 'colorpicker',
					label: 'Foreground color (Default)',
					id: 'fg_default',
					default: ColorWhite,
				},
				{
					type: 'colorpicker',
					label: 'Background color (Default)',
					id: 'bg_default',
					default: ColorTrack,
					isVisible: () => false,
				},
				{
					type: 'colorpicker',
					label: 'Foreground color (Down)',
					id: 'fg_down',
					default: ColorDown,
				},
				{
					type: 'colorpicker',
					label: 'Background color (Down)',
					id: 'bg_down',
					default: ColorBlack,
					isVisible: () => false,
				},
			],
			callback: (feedback, _context) => {
				const trackerId = Number(feedback.options.tracker_id)
				const type = String(feedback.options.tracker_type)
				const axis = String(feedback.options.tracker_axis)
				const value = Number(self.getVariableValue(`tracker_${trackerId}_${type}_${axis}`))

				if (value > 0) {
					return {
						color: Number(feedback.options.fg ?? ColorWhite),
						bgcolor: Number(feedback.options.bg ?? ColorGreen),
					}
				} else if (value < 0) {
					return {
						color: Number(feedback.options.fg_down ?? ColorWhite),
						bgcolor: Number(feedback.options.bg_down ?? ColorRed),
					}
				} else {
					return {
						color: Number(feedback.options.fg_default ?? ColorGray),
						bgcolor: Number(feedback.options.bg_default ?? ColorWhite),
					}
				}
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
				const packetrate = Number(self.getVariableValue('system_packet_rate'))
				return packetrate > 0
			},
		},
	})
}
