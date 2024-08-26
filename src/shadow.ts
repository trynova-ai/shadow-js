import { v4 as uuidv4 } from 'uuid';
import { BrowserPlugin } from './plugins/browser';

interface Plugin {
    setup: (shadow: Shadow) => void;
}

interface ShadowOptions {
    token: string;
    url: string;
    sessionProvider?: () => string;
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
        this.sessionId = options.sessionProvider ? options.sessionProvider() : this.getStoredSessionId();
        this.plugins = options.plugins || [new BrowserPlugin()];
        try {
            this.setupPlugins();
        } catch (error) {
            console.error('Error setting up plugins:', error);
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
        const payload = {
            ...event,
            sessionId: this.sessionId,
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
        };

        fetch(this.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(error => console.error('Error sending session events:', error));
    }
}
