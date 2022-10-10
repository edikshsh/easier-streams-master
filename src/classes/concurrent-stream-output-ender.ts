import EventEmitter from "events";

type StreamGroupControllerEvents = {
    end: () => void,
    close: () => void,
    finish: () => void,
}

// When piping transforms, there are some event that end all piped transforms (finish, end, close)
// When connecting many source transforms to one destination transform simultaneousely, 
// we dont want to finish the destination when the source transform emits any of these events,
// but only when ALL of the source transforms finished emitting these events.
// So we have to pipe them with options: { end: false } and run this function to take care of them
export function streamsManyToOneController(inputLayer: EventEmitter[], output: EventEmitter) {
    const eventCounter: Record<keyof StreamGroupControllerEvents, number> = {
        close: 0,
        end: 0,
        finish: 0,
    }
    const concurrency = inputLayer.length;
    for (const event in eventCounter) {
        inputLayer.forEach((input) => {
            input.once(event, () => {
                const inputsCalledCurrentEvent = (++eventCounter[event as keyof StreamGroupControllerEvents]);
                // console.log(`${event} => ${inputsCalledCurrentEvent}`);
                if (inputsCalledCurrentEvent === concurrency) {
                    // console.log(`emitting ${event}`);
                    output.emit(event)
                }
            })
        })
    }
}