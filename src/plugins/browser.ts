import { Shadow } from '../shadow';

// Define the structure for a scrubbing rule
type ScrubRule = {
    type: 'id' | 'regex';
    match: string;
    method: 'mask' | 'randomize';
};

export class BrowserPlugin {    
    private scrubRules: ScrubRule[] = [];

    constructor(scrubRules: ScrubRule[] = []) {
        this.scrubRules = scrubRules; 
    }

    setup(shadow: Shadow) {
        const listeners = [
            { type: 'pointerdown', handler: (event: Event) => this.handleEvent('click', event, shadow) },
            { type: 'change', handler: (event: Event) => this.handleEvent('change', event, shadow) },
            { type: 'submit', handler: (event: Event) => this.handleEvent('submit', event, shadow) },
            { type: 'load', handler: (event: Event) => this.handleEvent('load', event, shadow) }
        ];
    
        this.setupListeners(listeners);
    }

    private setupListeners(events: { type: string, handler: EventListener }[]) {
        events.forEach(event => {
            window.addEventListener(event.type, event.handler);
        });
    }
    
    private handleEvent(eventType: string, event: Event, shadow: Shadow) {
        try {
            const target = this.resolveTargetElement(event.target as Element);
            const payload = this.eventPayload(eventType, target);

            // Apply scrubbing to the event payload
            const scrubbedPayload = this.applyScrubbingRules(payload);

            shadow.capture(scrubbedPayload);
        } catch (error) {
            console.error(`Error handling ${eventType} event:`, error);
        }
    }
    

    private eventPayload(eventType: string, target: Element | null) {
        try {
            const payload: any = {
                action: eventType.toUpperCase(),
                page: window.location.href,
                previousPage: document.referrer ? document.referrer : '',
                timestamp: new Date().toISOString(),
                element: target ? {
                    tag: target.tagName || '',
                    css: target instanceof HTMLElement ? target.style.cssText : '',
                    attributes: this.getAttributes(target),
                    innerText: target instanceof HTMLElement ? target.innerText : '',
                } : null,
            };

            // Check if the event is a change event
            if (eventType === 'change' && target instanceof HTMLInputElement) {
                payload.action = 'INPUT';
            } else if (eventType === 'change' && target instanceof HTMLSelectElement) {
                payload.action = 'SELECT';
            } else if (eventType === 'change' && target instanceof HTMLTextAreaElement) {
                payload.action = 'INPUT';
            }

            return payload;
        } catch (error) {
            console.error(`Error creating event payload for ${eventType} event:`, error);
            return null;
        }
    }

    private applyScrubbingRules(payload: any) {
        if (!payload.element) return payload;

        const element = payload.element;

        this.scrubRules.forEach((rule) => {
            if (rule.type === 'id' && element.attributes.id === rule.match) {
                // For ID-based rules, scrub innerText and the "value" attribute
                this.scrubData(element, rule, 'innerText');
                if (element.attributes['value']) {
                    this.scrubData(element, rule, 'value', true);
                }
            } else if (rule.type === 'regex') {
                const regex = new RegExp(rule.match);

                // For regex-based rules, scrub innerText and any matching attribute values
                if (regex.test(element.innerText || '')) {
                    this.scrubData(element, rule, 'innerText');
                }

                Object.keys(element.attributes).forEach((attrKey) => {
                    const attrValue = element.attributes[attrKey];
                    if (regex.test(attrValue)) {
                        this.scrubData(element, rule, attrKey, true);
                    }
                });
            }
        });

        return payload;
    }

    private scrubData(element: any, rule: ScrubRule, key: string, isAttribute: boolean = false) {
        if (rule.method === 'mask') {
            if (isAttribute) {
                element.attributes[key] = '****'; // Mask sensitive attribute value
            } else {
                element[key] = '****'; // Mask sensitive innerText
            }
        } else if (rule.method === 'randomize') {
            const randomValue = Math.random().toString(36).substr(2, 10);
            if (isAttribute) {
                element.attributes[key] = randomValue; // Randomize sensitive attribute value
            } else {
                element[key] = randomValue; // Randomize sensitive innerText
            }
        }
    }

    private resolveTargetElement(target: Element): Element {
        try {
            let targetElement: Element | null = target;

            // Traverse up the DOM tree to find the nearest parent that is either a <button> or has role="button"
            while (targetElement && targetElement !== document.body) {
                if (targetElement.tagName.toLowerCase() === 'button' || targetElement.getAttribute('role') === 'button') {
                    break;
                }
                targetElement = targetElement.parentElement;
            }

            // If no button was found or the element doesn't have id/class, find the nearest parent with id or class
            if (!targetElement?.id && !this.getClassNames(targetElement)) {
                targetElement = target; // Start again from the original clicked element
                
                while (targetElement && targetElement !== document.body) {
                    if (targetElement.id || this.getClassNames(targetElement)) {
                        break; // Found a parent with an id or class, use this
                    }
                    targetElement = targetElement.parentElement;
                }
            }

            return targetElement || target;
        } catch (error) {
            console.error('Error resolving target element:', error);
            return target;
        }
    }

    private getAttributes(element: Element | null): { [key: string]: string } {
        try {
            const attrs: { [key: string]: string } = {};
            if (element) {
                for (let i = 0; i < element.attributes.length; i++) {
                    attrs[element.attributes[i].name] = element.attributes[i].value;
                }
            }
            return attrs;
        } catch (error) {
            console.error('Error getting element attributes:', error);
            return {};
        }
    }

    private getClassNames(element: Element | null): string {
        try {
            if (!element) return '';
            
            if (element instanceof HTMLElement) {
                return element.className;
            } else if (element instanceof SVGElement && typeof element.className === 'object') {
                return element.className.baseVal; // SVG className is an object with baseVal
            }

            return '';
        } catch (error) {
            console.error('Error getting element class names:', error);
            return '';
        }
    }
}
