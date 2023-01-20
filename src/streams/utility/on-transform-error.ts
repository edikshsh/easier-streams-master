import { StreamError } from '../errors/stream-error';
import { FullTransformOptions } from '../transforms/types/full-transform-options.type';
import { TypedTransformCallback } from '../transforms/types/typed-transform-callback';
import { getFormattedChunk } from './get-formatted-chunk';

export function onTransformError<TSource, TDestination>(
    error: unknown,
    chunk: TSource,
    callback: TypedTransformCallback<TDestination>,
    options?: FullTransformOptions<TSource>,
) {
    const finalError = error instanceof Error ? error : new Error(`${error}`);
    if (options?.errorStream) {
        const formattedChunk = getFormattedChunk(chunk, options);
        const streamError = new StreamError(finalError, formattedChunk);
        return callback(null, streamError as any);
    }
    return callback(finalError);
}
