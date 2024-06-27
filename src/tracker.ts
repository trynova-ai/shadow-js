import { v4 as uuidv4 } from 'uuid';
import { WebAppPlugin } from './plugins/webapp';

interface Plugin {
    setup: (tracker: UserSessionTracker) => void;
}

interface TrackerOptions {
    token: string;
    url: string;
    sessionIdProvider?: () => string;
    plugins?: Plugin[];
}

export class UserSessionTracker {
    private token: string;
    private url: string;
    private sessionId: string;
    private plugins: Plugin[];

    constructor(options: TrackerOptions) {
        this.token = options.token;
        this.url = options.url;
        this.sessionId = options.sessionIdProvider ? options.sessionIdProvider() : this.getStoredSessionId();
        this.plugins = options.plugins || [new WebAppPlugin()];

        this.setupPlugins();
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

    public trackEvent(event: any) {
        const payload = {
            ...event,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
        };

        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        });

        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.url, blob);
    }
}
