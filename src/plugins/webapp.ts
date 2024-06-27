import { UserSessionTracker } from '../tracker';

export class WebAppPlugin {
    setup(tracker: UserSessionTracker) {
        window.addEventListener('click', (event) => {
            tracker.trackEvent(this.createEventPayload(event, 'click'));
        });

        window.addEventListener('input', (event) => {
            tracker.trackEvent(this.createEventPayload(event, 'input'));
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
