import { StreamError } from "./stream-error";


export function passStreamError() {
    return (streamError: StreamError<unknown>) => {
        return streamError instanceof StreamError;
    }
}