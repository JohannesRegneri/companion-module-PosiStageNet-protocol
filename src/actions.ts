import type { ModuleInstance } from './main.js'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		refresh_connection: {
			name: 'Refresh PosiStageNet Connection',
			options: [],
			callback: async () => {
				self.log('info', 'Manual connection refresh requested')
				await self.configUpdated(self.config)
			},
		},
		debug_status: {
			name: 'Debug Status',
			options: [],
			callback: async () => {
				self.log('info', `Current tracker count: ${self.getVariableValue('tracker_count') || 0}`)
				self.log('info', `System name: ${self.getVariableValue('system_name') || 'Not set'}`)
				self.log('info', `Socket listening on port: ${self.config.port}`)
			},
		},
	})
}
