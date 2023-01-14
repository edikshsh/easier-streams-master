import { StreamError } from './stream-error';

export function isStreamError<T>(streamError: unknown): streamError is StreamError<T> {
    return streamError instanceof StreamError;
}
