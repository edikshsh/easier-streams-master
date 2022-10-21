import { StreamError } from "./stream-error";


export function isStreamError(streamError: unknown){
    return streamError instanceof StreamError;
}