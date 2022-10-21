type StreamGroupControllerEvents = {
    end: () => void,
    close: () => void,
    finish: () => void,
}


export type StreamGroupControllerEventCounter = Record<keyof StreamGroupControllerEvents, number>;
