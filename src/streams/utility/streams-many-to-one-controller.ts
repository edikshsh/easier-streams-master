import EventEmitter from "events";
import { StreamGroupControllerEventCounter } from "./stream-group-output-controller-event-counter.type";

// When piping transforms, there are some event that end all piped transforms (finish, end, close)
// When connecting many source transforms to one destination transform simultaneousely, 
// we dont want to finish the destination when the source transform emits any of these events,
// but only when ALL of the source transforms finished emitting these events.
// So we have to pipe them with options: { end: false } and run this function to take care of them

export function streamsManyToOneController(inputLayer: EventEmitter[], output: EventEmitter, eventCounter = getDefaultEventCounter()) {
    const concurrency = inputLayer.length;
    for (const event in eventCounter) {
        inputLayer.forEach((input) => {
            input.once(event, () => {
                const inputsCalledCurrentEvent = (++eventCounter[event as keyof StreamGroupControllerEventCounter]);
                // console.log(`${event} => ${inputsCalledCurrentEvent}`);
                if (inputsCalledCurrentEvent === concurrency) {
                    // console.log(`emitting ${event}`);
                    output.emit(event)
                }
            })
        })
    }
}

function getDefaultEventCounter(): StreamGroupControllerEventCounter{
    return {
        close: 0,
        end: 0,
        finish: 0,
    }
}