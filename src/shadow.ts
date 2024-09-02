import { v4 as uuidv4 } from 'uuid';
import { BrowserPlugin } from './plugins/browser';

interface Plugin {
    setup: (shadow: Shadow) => void;
}

interface BufferConfig {
    enabled: boolean;
    maxEvents?: number; // The maximum number of events to buffer before flushing
    flushInterval?: number; // The interval in milliseconds to flush events
}

interface ShadowOptions {
    url: string;
    headers?: Record<string, string>;
    sessionProvider?: () => string;
    plugins?: Plugin[];
    buffer?: BufferConfig;
    sampleRate?: number;  // The sample rate of clients that should be shadowed. Default is 0.1 (10%)
}

export class Shadow {
    private url: string;
    private headers: Record<string, string>;
    private sessionId: string;
    private plugins: Plugin[];
    private bufferConfig: BufferConfig;
    private eventBuffer: any[] = [];
    private flushTimeout: any;
    private isClientEnabled: boolean;

    constructor(options: ShadowOptions) {
        this.url = options.url;
        this.headers = options.headers || {};
        this.sessionId = options.sessionProvider ? options.sessionProvider() : this.getStoredSessionId();
        this.plugins = options.plugins || [new BrowserPlugin()];
        this.bufferConfig = options.buffer || { enabled: false };
        const sampleRate = options.sampleRate ?? 0.1; // Default to 10% if not provided
        this.isClientEnabled = Math.random() < sampleRate;

        if (this.isClientEnabled && this.bufferConfig.enabled) {
            this.startFlushInterval();
        }

        if (this.isClientEnabled) {
            try {
                this.setupPlugins();
            } catch (error) {
                console.error('Error setting up plugins:', error);
            }
        }
    }

    public static init(options: ShadowOptions): Shadow {
        return new Shadow(options);
    }

    private getStoredSessionId(): string {
        let sessionId = localStorage.getItem('session-id');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('session-id', sessionId);
        }
        return sessionId;
    }

    private setupPlugins() {
        this.plugins.forEach(plugin => plugin.setup(this));
    }

    public capture(event: any) {
        if (!this.isClientEnabled) return;

        const payload = {
            ...event,
            sessionId: this.sessionId,
        };

        if (this.bufferConfig.enabled) {
            this.eventBuffer.push(payload);
            if (this.eventBuffer.length >= (this.bufferConfig.maxEvents || 10)) {
                this.flushEvents();
            }
        } else {
            this.sendEvent(this.url + '/session', payload);
        }
    }

    private flushEvents() {
        if (this.eventBuffer.length > 0) {
            const bulkPayload = [...this.eventBuffer];
            this.eventBuffer = [];
            this.sendEvent(this.url + '/sessions', bulkPayload);
        }
    }

    private startFlushInterval() {
        this.flushTimeout = setInterval(() => {
            this.flushEvents();
        }, this.bufferConfig.flushInterval || 5000);
    }

    private sendEvent(endpoint: string, payload: any) {
        const headers = {
            ...this.headers,
            'Content-Type': 'application/json',
        };

        fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(error => console.error('Error sending session events:', error));
    }

    public stopFlushInterval() {
        clearInterval(this.flushTimeout);
    }
}
