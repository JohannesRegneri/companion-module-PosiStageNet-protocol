import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	advancedOptions?: boolean
	bind?: string
	decimals?: number
	customTrackers?: boolean
	customTrackerList?: string
	customFeatures?: boolean
	usePos?: boolean
	useSpeed?: boolean
	useOri?: boolean
	useAccel?: boolean
	useTrgtPos?: boolean
	useValidity?: boolean
	useTimestamp?: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'This module will connect to a PosiStageNet (PSN) tracking server.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Multicast Address',
			width: 6,
			tooltip: '(default: 236.10.10.10)',
			regex: Regex.IP,
			default: '236.10.10.10',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Multicast Port',
			width: 6,
			tooltip: '(default: 56565)',
			min: 1,
			max: 65535,
			default: 56565,
		},
		{
			type: 'checkbox',
			id: 'advancedOptions',
			label: 'Advanced Options',
			width: 12,
			default: false,
		},
		{
			type: 'textinput',
			id: 'bind',
			label: 'Bind to specific IP',
			width: 6,
			tooltip: 'the IP address of the network interface to bind to. default is $(internal:bind_ip)',
			regex: Regex.IP,
			default: '0.0.0.0',
			isVisible: (options) => options.advancedOptions === true,
		},
		{
			type: 'number',
			id: 'decimals',
			label: 'Decimals:',
			width: 6,
			tooltip: 'The number of decimal places in the variables',
			default: 2,
			min: 0,
			max: 4,
			required: true,
			isVisible: (options) => options.advancedOptions === true,
		},
		{
			type: 'checkbox',
			id: 'customTrackers',
			label: 'Only show specific Tracker IDs',
			width: 4,
			default: false,
			isVisible: (options) => options.advancedOptions === true,
		},
		{
			type: 'static-text',
			id: 'blank',
			label: '',
			width: 6,
			value: '',
			isVisible: (options) => options.customTrackers === false,
		},
		{
			type: 'textinput',
			id: 'customTrackerList',
			label: `Tracker IDs:`,
			width: 6,
			tooltip: `Show specific tracker or tracker range ("-1"=all trackers)(e.g. "0-5,34,100-130")`,
			default: '0-100',
			regex: '/^(([0-9]+(-[0-9]+){0,1}),{0,1}){1,}$/',
			isVisible: (options) => options.customTrackers === true,
		},
		{
			type: 'checkbox',
			id: 'customFeatures',
			label: 'Only use specific features of Tracker IDs',
			width: 12,
			default: false,
			isVisible: (options) => options.advancedOptions === true,
		},

		{
			type: 'checkbox',
			id: 'usePos',
			label: 'Position',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
		{
			type: 'checkbox',
			id: 'useSpeed',
			label: 'Speed',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
		{
			type: 'checkbox',
			id: 'useOri',
			label: 'Orientation',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},

		{
			type: 'checkbox',
			id: 'useAccel',
			label: 'Acceleration',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
		{
			type: 'checkbox',
			id: 'useTrgtPos',
			label: 'Targetposition',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
		{
			type: 'checkbox',
			id: 'useTimestamp',
			label: 'Timestamp',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
		{
			type: 'checkbox',
			id: 'useValidity',
			label: 'Validity',
			width: 3,
			default: true,
			isVisible: (options) => options.customFeatures === true,
		},
	]
}
