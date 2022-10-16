import { EventEmitter } from "stream";

class EventPromisifier {

    async _promisifyEvents(emitter: EventEmitter, resolveEvents: string[] | string = [], rejectEvents: string[] | string = []): Promise<unknown> {
        resolveEvents = typeof resolveEvents === 'string' ? [resolveEvents] : resolveEvents
        rejectEvents = typeof rejectEvents === 'string' ? [rejectEvents] : rejectEvents
        resolveEvents = resolveEvents.filter(event => event)
        rejectEvents = rejectEvents.filter(event => event)
        if (!(resolveEvents.length || rejectEvents.length)) {
            return undefined;
        }

        return new Promise<unknown>((resolve, reject) => {
            const allEvents = [...resolveEvents, ...rejectEvents];
            const functionsToTurnOff: { func: ((...args: unknown[]) => unknown), event: string }[] = []
            const wrapper = (eventString: string) => {
                const eventListenerFunction = (data: unknown) => {
                    functionsToTurnOff.forEach(item => emitter.off(item.event, item.func));
                    if (resolveEvents.includes(eventString)) {
                        resolve(data)
                    } else {
                        reject(data);
                    }
                }
                functionsToTurnOff.push({ event: eventString, func: eventListenerFunction });
                return eventListenerFunction;
            }

            allEvents.forEach(event => emitter.on(event, wrapper(event)));
        });
    }
}

export const eventPromisifier = new EventPromisifier();