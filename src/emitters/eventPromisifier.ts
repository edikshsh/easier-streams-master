import { EventEmitter } from "stream";

class EventPromisifier {

    async _promisifyEvents(emitter: EventEmitter, resolveEvents: string[] = [], rejectEvents: string[] = []): Promise<unknown> {
        resolveEvents = resolveEvents.filter(event => event)
        rejectEvents = rejectEvents.filter(event => event)
        if(!(resolveEvents.length || rejectEvents.length)){
            return undefined;
        }
        // return new Promise<unknown>((resolve, reject) => {
        //     const wrapReject = (...args: unknown[]) => {
        //         console.log('rejecting_gggddd');
        //         resolveEvents.forEach(resolveEvent => emitter.off(resolveEvent, wrapResolve));
        //         rejectEvents.forEach(rejectEvent => emitter.off(rejectEvent, wrapReject));
        //         reject(...args);
        //     }
        //     const wrapResolve = (arg: unknown) => {
        //         console.log('resolving_gggddd');                
        //         resolveEvents.forEach(resolveEvent => emitter.off(resolveEvent, wrapResolve));
        //         rejectEvents.forEach(rejectEvent => emitter.off(rejectEvent, wrapReject));
        //         resolve(arg);
        //     }
        //     resolveEvents.forEach(resolveEvent => emitter.on(resolveEvent, wrapResolve));
        //     rejectEvents.forEach(rejectEvent => emitter.on(rejectEvent, wrapReject));
        // });

        return new Promise<unknown>((resolve, reject) => {
            const allEvents = [...resolveEvents, ...rejectEvents];
            const functionsToTurnOff: {func: ((...args: any[]) => unknown), event: string}[] = []
            const wrapper = (eventString: string) => 
            {
                const eventListenerFunction = (data: unknown) => {
                    functionsToTurnOff.forEach(item => emitter.off(item.event, item.func));
                    if(resolveEvents.includes(eventString)){
                        resolve(data)
                    } else {
                        reject(data);
                    }
    
                }
                functionsToTurnOff.push({event: eventString, func: eventListenerFunction});
                return eventListenerFunction;
            }

            allEvents.forEach(event => emitter.on(event, wrapper(event)));
        });
    }
}

export const eventPromisifier = new EventPromisifier();