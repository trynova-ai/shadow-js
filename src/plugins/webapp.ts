import { Shadow } from '../shadow';

interface WebAppPluginOptions {
    ignoreEvents?: string[];
}

export class WebAppPlugin {
    private events: string[] = ['click', 'input', 'submit', 'popstate', 'load'];
    private ignoreEvents: string[];

    constructor(options: WebAppPluginOptions = {}) {
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
        return {
            eventType,
            page: window.location.href,
            previousPage: document.referrer ? document.referrer : '',
            interactedElement: target ? target.tagName : '',
            elementId: target ? target.id : '',
            elementClasses: target ? target.className : '',
        };
    }
}