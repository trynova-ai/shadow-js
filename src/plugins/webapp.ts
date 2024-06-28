import { Shadow } from '../shadow';

export class WebAppPlugin {
    setup(shadow: Shadow) {
        window.addEventListener('click', (event) => {
            shadow.trackEvent(this.createEventPayload(event, 'click'));
        });

        window.addEventListener('input', (event) => {
            shadow.trackEvent(this.createEventPayload(event, 'input'));
        });
    }

    private createEventPayload(event: Event, eventType: string) {
        const target = event.target as HTMLElement;
        return {
            eventType,
            page: window.location.href,
            previousPage: document.referrer,
            interactedElement: target.tagName,
            elementId: target.id,
            elementClasses: target.className,
        };
    }
}
