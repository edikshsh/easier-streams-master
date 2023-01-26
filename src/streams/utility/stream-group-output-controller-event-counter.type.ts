type StreamGroupControllerEvents = {
    end: () => void;
    close: () => void;
    finish: () => void;
    error: () => void;
};

export type StreamGroupControllerEventCounter = Record<keyof StreamGroupControllerEvents, number>;
