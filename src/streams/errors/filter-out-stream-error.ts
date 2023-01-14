import { passStreamError } from './pass-stream-error';
import { StreamError } from './stream-error';

export function filterOutStreamError() {
    const isStreamError = passStreamError();
    return (streamError: StreamError<unknown>) => {
        return !isStreamError(streamError);
    };
}
