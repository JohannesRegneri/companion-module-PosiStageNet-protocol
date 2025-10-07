# companion-module-posistagenet-protocol

A Companion module for connecting to PosiStageNet tracking systems and accessing real-time tracker data.

## Features

- Connects to PosiStageNet servers via UDP multicast
- Supports multiple trackers simultaneously
- Exposes tracker data as Companion variables (position, speed, orientation, etc.)
- Real-time updates of tracker information
- Compatible with any PosiStageNet-enabled tracking system

## Variables

The module creates variables for each detected tracker:

- `tracker_<id>_name` - Tracker name
- `tracker_<id>_pos_x/y/z` - Position coordinates (meters)
- `tracker_<id>_speed_x/y/z` - Velocity (meters/second)
- `tracker_<id>_ori_x/y/z` - Orientation (radians)
- `tracker_<id>_validity` - Tracker validity
- `tracker_<id>_accel_x/y/z` - Acceleration (meters/second²)
- `tracker_<id>_trgtpos_x/y/z` - Target position (meters)
- `tracker_<id>_timestamp` - Tracker timestamp

System variables:

- `system_name` - PSN system name
- `system_tracker_count` - Number of active trackers
- `system_tracker_ids` - List of available tracker ids
- `system_packet_rate` - Rate of packets per second

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## Getting started

Executing a `yarn` command should perform all necessary steps to develop the module, if it does not then follow the steps below.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn dev` the compiler will be run in watch mode to recompile the files on change.
