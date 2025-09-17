import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	max_trackers?: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Multicast Address (default: 236.10.10.10)',
			width: 8,
			regex: Regex.IP,
			default: '236.10.10.10',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Multicast Port (default: 56565)',
			width: 4,
			min: 1,
			max: 65535,
			default: 56565,
		},
		{
			type: 'number',
			id: 'max_trackers',
			label: 'Max trackers to follow',
			width: 4,
			min: 1,
			max: 255,
			default: 6,
		},
	]
}
