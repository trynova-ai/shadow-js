import { Shadow } from '../shadow';

export class BrowserPlugin {
    setup(shadow: Shadow) {
        try {
            window.addEventListener('pointerdown', (event: Event) => {
                try {
                    const targetElement = this.resolveTargetElement(event.target as Element);
                    shadow.capture(this.eventPayload('click', targetElement));
                } catch (error) {
                    console.error('Error handling click event:', error);
                }
            });

            window.addEventListener('change', (event: Event) => {
                try {
                    const targetElement = event.target instanceof Element ? event.target : null;
                    shadow.capture(this.eventPayload('change', targetElement));
                } catch (error) {
                    console.error('Error handling change event:', error);
                }
            });

            window.addEventListener('submit', (event: SubmitEvent) => {
                try {
                    const targetElement = event.target instanceof Element ? event.target : null;
                    shadow.capture(this.eventPayload('submit', targetElement));
                } catch (error) {
                    console.error('Error handling submit event:', error);
                }
            });

            window.addEventListener('load', (event: Event) => {
                try {
                    const targetElement = event.target instanceof Element ? event.target : null;
                    shadow.capture(this.eventPayload('load', targetElement));
                } catch (error) {
                    console.error('Error handling load event:', error);
                }
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
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
                    id: target.id || '',
                    class: this.getClassNames(target),
                    tag: target.tagName || '',
                    css: target instanceof HTMLElement ? target.style.cssText : '',
                    attributes: this.getAttributes(target),
                    inner_text: target instanceof HTMLElement ? target.innerText : '',
                } : null,
            };

            // Check if the event is a change event
            if (eventType === 'change' && target instanceof HTMLInputElement) {
                payload.action = 'INPUT';
                payload.value = target.value;
            } else if (eventType === 'change' && target instanceof HTMLSelectElement) {
                payload.action = 'SELECT';
                payload.value = target.value;
            } else if (eventType === 'change' && target instanceof HTMLTextAreaElement) {
                payload.action = 'INPUT';
                payload.value = target.value;
            }

            return payload;
        } catch (error) {
            console.error(`Error creating event payload for ${eventType} event:`, error);
            return null;
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
