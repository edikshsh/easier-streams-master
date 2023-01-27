import { Stream } from 'stream';
import { StreamError } from '../errors/stream-error';
import { FullTransformOptions } from '../transforms/types/full-transform-options.type';
import { TypedTransformCallback } from '../transforms/types/typed-transform-callback';
import { getFormattedChunk } from './get-formatted-chunk';

export function onTransformError<TSource, TDestination>(
    stream: Stream,
    error: unknown,
    chunk: TSource,
    callback: TypedTransformCallback<TDestination>,
    options?: FullTransformOptions<TSource>,
) {
    if(options?.ignoreErrors){
        return callback();
    }
    const finalError = error instanceof Error ? error : new Error(`${error}`);
    if (options?.shouldPushErrorsForward) {
        const formattedChunk = getFormattedChunk(chunk, options);
        const streamError = new StreamError(finalError, formattedChunk);
        return callback(null, streamError as any);
    }
    stream.emit('source-error', finalError);
    return callback(finalError);
}
