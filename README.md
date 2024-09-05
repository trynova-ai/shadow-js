# Shadow JS Client

The Shadow JS client allows you to capture and track user interactions on your web application. You can configure custom plugins, such as the `BrowserPlugin`, to capture events and scrub sensitive data based on user-defined rules.

## Installation

To use the Shadow JS Client, install the package and initialize it in your application:

```bash
npm install @trynova-ai/shadow-js
```

## Basic Usage

Below is an example of how to initialize the `Shadow` client with custom scrubbing rules, event buffering, and sample rate configuration.

```javascript
// Define custom scrub rules
const customScrubRules = [
  { type: 'id', match: 'credit-card', method: 'mask' },
  { type: 'regex', match: '\\d{4}-\\d{4}-\\d{4}-\\d{4}', method: 'randomize' }
];

// Initialize Shadow client
Shadow.init({
  headers: {
    'X-API-KEY': 'MY_API_KEY', // Your API Key
  },
  url: 'http://localhost:8080', // API endpoint to send captured events
  plugins: [new BrowserPlugin(customScrubRules)], // Attach BrowserPlugin with scrub rules
  buffer: {
    enabled: true,  // Enable event buffering
    maxEvents: 20,  // Buffer up to 20 events before sending
    flushInterval: 10000,  // Flush events every 10 seconds
  },
  sampleRate: 0.1,  // Sample 10% of clients (default is 10%)
});
```

### Configuration Options

- **headers**: HTTP headers for authentication, such as API keys.
- **url**: The API URL where events are sent.
- **plugins**: Array of plugins (e.g., `BrowserPlugin`) to extend functionality.
- **buffer**: Configuration for event buffering:
  - `enabled`: Enable or disable buffering.
  - `maxEvents`: The maximum number of events to buffer before sending them.
  - `flushInterval`: The interval (in milliseconds) to flush events automatically.
- **sampleRate**: Percentage of clients that will be tracked (default: 10%).

### Scrubbing Rules

You can define custom scrubbing rules to protect sensitive data captured in event payloads. The rules can be based on element IDs or regular expressions matching specific patterns.

#### Scrubbing Rule Example

```javascript
const customScrubRules = [
  { type: 'id', match: 'credit-card', method: 'mask' },
  { type: 'regex', match: '\\d{4}-\\d{4}-\\d{4}-\\d{4}', method: 'randomize' }
];
```

### Event Buffering

The client supports event buffering to optimize network usage. Instead of sending events one by one, you can batch multiple events together and send them at defined intervals or when the buffer is full.

```javascript
buffer: {
  enabled: true,  // Enable event buffering
  maxEvents: 20,  // Buffer up to 20 events
  flushInterval: 10000,  // Flush every 10 seconds
}
```

### Plugins

The Shadow JS client supports plugins to extend its functionality.

```javascript
plugins: [new BrowserPlugin()];
```

### Sample Rate

You can configure the percentage of users who will be tracked with the `sampleRate` option. The default value is 0.1 (10%).

```javascript
sampleRate: 0.1,  // Sample 10% of clients
```

## License

[Apache License 2.0](LICENSE)
