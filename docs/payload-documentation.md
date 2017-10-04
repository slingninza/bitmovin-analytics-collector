# Analytics Payload Documentation

Bitmovin Analytics collects information about playback behavior in samples. Each sample has a `timestamp` as well as a `duration` and thus represents a chunk of time that passed on the client in which the player was in a distinct state.

To illustrate here is the beginning of a typical session while the player is going through the different states. Each line represents one JSON payload that gets sent back to the client.

```
player startup:                  +----+
video startup:                        +-+
video playback @500kbps:                +--------+
video playback @1mbps:                           +---------+
```

If we look at the first sample the json payload would contain the following information:

```
time: <client timestamp>
state: 'startup'
duration: 300ms
playerStartupTime: 300ms
videoStartupTime: 0ms
videoBitrate: 0
```

The second sample that represents the video startup would therefore look like this:

```
time: <client timestamp>
state: 'video startup'
duration: 60ms
playerStartupTime: 0
videoStartupTime: 60ms
videoBitrate: 0
```

and the third that represents the initial playout at 500 kbps over 1 second:

```
time: <client timestamp>
state: 'playing'
duration: 1000ms
playerStartupTime: 0
videoStartupTime: 0
videoBitrate: 500000
```

as well as the last sample that gets sent after the quality switch up:

```
time: <client timestamp>
state: 'playing'
duration: 1000ms
playerStartupTime: 0
videoStartupTime: 0
videoBitrate: 1000000
```

As you can see a lot of fields with `0` are being sent subsequently. The JSON payload always has the same fields, but depending on the state the player is in they are either set or not. There are some fields that are always set, notably the custom data fields like `videoId`, `cdnProvider`, `customData1-5` as well as fields that don't represent a distinct state change but rather information about the state of the player during the current sample, regardless of it's state like `streamFormat` (which stream technology was used, DASH/HLS or Progressive) or the `playerTech` (either native, html5 or flash).

A full list of the JSON payload fields and their description can be found here:

[Payload Field Documentation](https://docs.google.com/spreadsheets/d/1sSFGtKfOS-efQFDB6FFbNPYFXUnauHBqhyP5AFt4ZJA/edit?usp=sharing)

All these fields need to be supplied with the right datatype for the ingest to accept them.

## Custom Integrations

When developing a custom integration we strongly recommend you follow roughly the same model as the web collector. The code is open source and can be viewed on GitHub: [bitmovin-analytics-collector](https://github.com/bitmovin/bitmovin-analytics-collector)

The web collector follows the following approach:

A core class that maintains the current analytics sample that will be sent to the server once an event happens. This sample contains all the background non-event based information about the state we discussed earlier (streamFormat, videoId etc..). A state machine keeps is hooked up to the player events and whenever the state machine transitions to a new state the current analytics sample is being sent off to the server along with the relevant information from the state transition.