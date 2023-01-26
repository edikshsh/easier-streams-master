export type TransformEvents<T> = BaseTransformEvents<T> & SourceErrorEvent

export type BaseTransformEvents<T> = {
    data: (chunk: T) => void;
    end: () => void;
    close: () => void;
    error: (error: Error) => void;
    pause: () => void;
    readable: () => void;
    resume: () => void;
};
export const SOURCE_ERROR =  'source-error';
export type SourceErrorEvent = {
    [SOURCE_ERROR]: (error: Error) => void; // Emits only on the transform from where the error originates
};

