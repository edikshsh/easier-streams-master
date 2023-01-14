import cloneDeep from "lodash.clonedeep";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { BaseTransform } from "./base-transform";
import { TransformFunction } from "./simple-transform";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { StreamError } from "../../errors/stream-error";


export type AsyncTransformFunction<TSource, TDestination> = TransformFunction<TSource, Promise<TDestination>>;


export class SimpleAsyncTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination>{

    constructor(private transformer: AsyncTransformFunction<TSource, TDestination | undefined>, private options?: FullTransformOptions<TSource>) {
        super(options);
    }

    async _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk)
        try {
            const result = await this.transformer(chunk);
            return callback(null, result);
        }
        catch (error) {
            const finalError = error instanceof Error ? error : new Error(`${error}`)
            if (this.options?.errorStream) {
                const streamError = new StreamError(finalError, chunkClone);
                return callback(null, streamError as any);
            }
            return callback(finalError);
        }
    }
}

// function asdf<TDestination>(data: TDestination, error: Error, isPipedToErrorStream: boolean): {
//     error: StreamError<TDestination> | Error | null,
//     data: StreamError<TDestination> | null
// } {
//     const finalError = error instanceof Error ? error : new Error(`${error}`)
//     if (isPipedToErrorStream) {
//         const streamError = new StreamError(finalError, data);
//         return { error: null, data: streamError }
//     }
//     return { error: finalError, data: null }
// }