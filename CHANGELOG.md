# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [development]

### Added

- Ad Tracking with Player v8
- `AnalyticsPlayerModule` class
- `Analytics.version` returns the version of the analytics collector

### Removed

- `.augment` syntax removed in favor of ES6 classes
- `.register` syntax removed in favor of ES6 classes 
- `window.bitmovin.analytics`
- `window.bitmovin.analytics.Players`
- `window.bitmovin.analytics.CdnProviders`
- `window.bitmovin.analytics.PlayerModule`
- `window.bitmovin.analytics.version`

### Fixed
- Unsmooth audio track switching
  https://github.com/bitmovin/player-issues-web/issues/1465

### Internal
- Added a polyfill for `NodeList.prototype.forEach` (untracked)

## [v1.7.3] - 5/10/2018

### Fixed
- `pageLoadType` was not correctly detected for subsequent sessions in the same player
- `playerStartupTime` was reported as `NULL` instead of `0` for subsequent sessions in the same player
- Internal improvements and refactorings

## [v1.7.2] - 21/09/2018

### Fixed
- `isLive` detection was broken in subsequent sessions on the same player

## [v1.7.1] - 10/09/2018

### Added
- added default export for es6 style imports

## [v1.7.0] - 07/09/2018

### Added
- Bitmovin Player v8 Support
- `title` configuration attribute
- introduced new [new "embedded" configuration API](https://bitmovin.com/docs/analytics/faqs/collector-v1-7-embedded-analytics-configuration-for-bitmovin-player)
- DRM performance tracking (`drmLoadType`, `drmLoadTime`)

### Removed

- Bitmovin Player v6 support
- Chromecast receiver side support

## [v1.6.0] - 23/04/2018

### Added
- DASH.js support
- HLS.js support
- Shaka player support
- HTML5 media element support

### Changed
- added source maps to the NPM package

### Fixed
- inaccuracies in seek time tracking
- video.js adapter bugfixes
