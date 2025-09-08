const dgram = require('dgram')

const MULTICAST_ADDR = '236.10.10.10'
const PORT = 56566 // Use different port to avoid conflict

console.log('Creating UDP socket...')
const socket = dgram.createSocket('udp4')

socket.on('listening', () => {
	const address = socket.address()
	console.log(`Socket listening on ${address.address}:${address.port}`)

	try {
		socket.addMembership(MULTICAST_ADDR)
		console.log(`Successfully joined multicast group ${MULTICAST_ADDR}`)
		console.log('Waiting for PSN Toolbox packets...')
		console.log('Make sure PSN Toolbox is running and sending data to 236.10.10.10:56565')
	} catch (error) {
		console.error(`Failed to join multicast group: ${error.message}`)
	}
})

socket.on('message', (msg, rinfo) => {
	console.log(`\n--- Received packet ---`)
	console.log(`From: ${rinfo.address}:${rinfo.port}`)
	console.log(`Size: ${msg.length} bytes`)
	console.log(`First 32 bytes (hex): ${msg.slice(0, 32).toString('hex')}`)

	// Try to identify PSN packet type
	if (msg.length >= 4) {
		const packetType = msg.readUInt16LE(0)
		if (packetType === 0x6756) {
			console.log(`PSN Info Packet detected!`)
		} else if (packetType === 0x6755) {
			console.log(`PSN Data Packet detected!`)
		} else {
			console.log(`Unknown packet type: 0x${packetType.toString(16)}`)
		}
	}
})

socket.on('error', (err) => {
	console.error(`Socket error: ${err.message}`)
})

socket.on('close', () => {
	console.log('Socket closed')
})

console.log(`Binding to port ${PORT}...`)
socket.bind(PORT)

// Keep the script running
process.on('SIGINT', () => {
	console.log('\nShutting down...')
	socket.close()
	process.exit(0)
})

// Timeout after 30 seconds if no packets received
setTimeout(() => {
	console.log('\n--- No packets received after 30 seconds ---')
	console.log('Possible issues:')
	console.log('1. PSN Toolbox is not running or not sending data')
	console.log('2. Windows Firewall is blocking multicast traffic')
	console.log("3. Network interface doesn't support multicast")
	console.log('4. PSN Toolbox is configured incorrectly')
	socket.close()
	process.exit(1)
}, 30000)
