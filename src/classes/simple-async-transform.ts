import cloneDeep from "lodash.clonedeep";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { BaseTransform } from "./base-transform";
import { StreamError } from "./error-stream";
import { TransformFunction } from "./simple-transform";

export type AsyncTransformFunction<TSource, TDestination> = TransformFunction<TSource, Promise<TDestination>>;

export class SimpleAsyncTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination>{

    constructor(private transformer: AsyncTransformFunction<TSource, TDestination | undefined>, private options?: FullTransformOptions<TSource>) {
        super(options);
    }

    async _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk)
        try {
            const result = await this.transformer(chunk);
            callback(null, result);
        }
        catch (error) {
            const finalError = error instanceof Error ? error : new Error(`${error}`)
            if (this.options?.errorStream) {
                const streamError: StreamError<TSource> = {
                    data: chunkClone,
                    error: finalError,
                    id: this.options?.errorStream.id
                }
                return callback(null, streamError as any);
            }
            return callback(finalError);
        }
    }
}