export type TransformEvents<T> = {
    data: (chunk: T) => void;
    end: () => void;
    close: () => void;
    error: (error: Error) => void;
    pause: () => void;
    readable: () => void;
    resume: () => void;
};
