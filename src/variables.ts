import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	// Start with basic system variables
	const variables = [
		{ variableId: 'system_name', name: 'PSN system name' },
		{ variableId: 'system_tracker_count', name: 'Number of active trackers' },
		{ variableId: 'system_tracker_ids', name: 'List of available tracker ids' },
		{ variableId: 'system_packet_rate', name: 'Rate of packets per second' },
	]

	// Since trackers are detected dynamically, we'll define a reasonable set of potential tracker variables
	// The actual values will be set when trackers are detected
	const keys = self.currentTrackerList
	//self.log('debug', `${keys}`)
	for (const i of keys) {
		const prefix = `tracker_${i}_`
		variables.push({ variableId: `${prefix}name`, name: `Tracker ${i} Name` })
		if (self.config.usePos) {
			variables.push(
				{ variableId: `${prefix}pos_x`, name: `Tracker ${i} Position X` },
				{ variableId: `${prefix}pos_y`, name: `Tracker ${i} Position Y` },
				{ variableId: `${prefix}pos_z`, name: `Tracker ${i} Position Z` },
			)
		}
		if (self.config.useSpeed) {
			variables.push(
				{ variableId: `${prefix}speed_x`, name: `Tracker ${i} Speed X` },
				{ variableId: `${prefix}speed_y`, name: `Tracker ${i} Speed Y` },
				{ variableId: `${prefix}speed_z`, name: `Tracker ${i} Speed Z` },
			)
		}
		if (self.config.useOri) {
			variables.push(
				{ variableId: `${prefix}ori_x`, name: `Tracker ${i} Orientation X` },
				{ variableId: `${prefix}ori_y`, name: `Tracker ${i} Orientation Y` },
				{ variableId: `${prefix}ori_z`, name: `Tracker ${i} Orientation Z` },
			)
		}
		if (self.config.useAccel) {
			variables.push(
				{ variableId: `${prefix}accel_x`, name: `Tracker ${i} Acceleration X` },
				{ variableId: `${prefix}accel_y`, name: `Tracker ${i} Acceleration Y` },
				{ variableId: `${prefix}accel_z`, name: `Tracker ${i} Acceleration Z` },
			)
		}
		if (self.config.useTrgtPos) {
			variables.push(
				{ variableId: `${prefix}trgtpos_x`, name: `Tracker ${i} Target Position X` },
				{ variableId: `${prefix}trgtpos_y`, name: `Tracker ${i} Target Position Y` },
				{ variableId: `${prefix}trgtpos_z`, name: `Tracker ${i} Target Position Z` },
			)
		}
		if (self.config.useValidity) {
			variables.push({ variableId: `${prefix}validity`, name: `Tracker ${i} Validity` })
		}
		if (self.config.useTimestamp) {
			variables.push({ variableId: `${prefix}timestamp`, name: `Tracker ${i} Timestamp` })
		}
	}

	self.setVariableDefinitions(variables)
}
