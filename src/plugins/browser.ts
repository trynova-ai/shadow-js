import { Shadow } from '../shadow';

interface BrowserPluginOptions {
    ignoreEvents?: string[];
}

export class BrowserPlugin {
    private events: string[] = ['click', 'change', 'submit', 'popstate', 'load'];
    private ignoreEvents: string[];

    constructor(options: BrowserPluginOptions = {}) {
        this.ignoreEvents = options.ignoreEvents || [];
    }

    setup(shadow: Shadow) {
        this.events.forEach(eventType => {
            if (!this.ignoreEvents.includes(eventType)) {
                window.addEventListener(eventType, (event) => {
                    shadow.capture(this.eventPayload(event, eventType));
                });
            }
        });
    }

    private eventPayload(event: Event, eventType: string) {
        const target = event.target as HTMLElement;
        const payload: any = {
            action: eventType.toUpperCase(),
            page: window.location.href,
            previousPage: document.referrer ? document.referrer : '',
            timestamp: new Date().toISOString(),
            element: {
                id: target ? target.id : '',
                class: target ? target.className : '',
                tag: target ? target.tagName : '',
                css: target ? target.style.cssText : '',
                attributes: this.getAttributes(target),
            },
        };

        // Check if the event is a change event
        if (eventType === 'change') {
            if (target instanceof HTMLInputElement) {
                payload.action = 'INPUT';
                payload.value = target.value;
            } else if (target instanceof HTMLSelectElement) {
                payload.action = 'SELECT';
                payload.value = target.value;
            } else if (target instanceof HTMLTextAreaElement) {
                payload.action = 'INPUT';
                payload.value = target.value;
            }
        }

        return payload;
    }

    private getAttributes(element: HTMLElement): { [key: string]: any } {
        const attrs: { [key: string]: any } = {};
        for (let i = 0; i < element.attributes.length; i++) {
            attrs[element.attributes[i].name] = element.attributes[i].value;
        }
        return attrs;
    }
}
