import { v4 as uuidv4 } from 'uuid';
import { WebAppPlugin } from './plugins/webapp';

interface Plugin {
    setup: (shadow: Shadow) => void;
}

interface ShadowOptions {
    token: string;
    url: string;
    sessionIdProvider?: () => string;
    plugins?: Plugin[];
}

export class Shadow {
    private token: string;
    private url: string;
    private sessionId: string;
    private plugins: Plugin[];

    constructor(options: ShadowOptions) {
        this.token = options.token;
        this.url = options.url;
        this.sessionId = options.sessionIdProvider ? options.sessionIdProvider() : this.getStoredSessionId();
        this.plugins = options.plugins || [new WebAppPlugin()];

        this.setupPlugins();
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
        const payload = {
            ...event,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
        };

        const headers = {
            type: 'application/json',
            authorization: `Bearer ${this.token}`,
        };

        const blob = new Blob([JSON.stringify(payload)], headers);
        navigator.sendBeacon(this.url, blob);
    }
}
