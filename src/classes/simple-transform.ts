import cloneDeep from "lodash.clonedeep";
import { TransformOptions } from "stream";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { TypedTransform } from "../types/typed-transform";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { BaseTransform } from "./base-transform";
import { StreamError } from "./error-stream";

export type TransformFunction<TSource, TDestination> = (item: TSource) => TDestination;


export class SimpleTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination> implements TypedTransform<TSource, TDestination>{

    constructor(private transformer: TransformFunction<TSource, TDestination | undefined>, private options?: FullTransformOptions<TSource>) {
        super(options);
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk)
        try {
            const result = this.transformer(chunk);
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
            // if(finalError.message === 'a123'){
            //     debugger;
            // }
            return callback(finalError);
        }
    }
}