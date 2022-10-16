import { FullTransformOptions } from "../../types/full-transform-options.type";
import { TypedTransformCallback } from "../../types/typed-transform-callback";
import { BaseTransform } from "../base-transform";
import { StreamError } from "../error-stream";
import cloneDeep from "lodash.clonedeep";


type ArrayElementType<T extends unknown[]> = T extends (infer U)[] ? U : never;

export class ArraySplitTransform<TSource extends unknown[]> extends BaseTransform<TSource, ArrayElementType<TSource>>{
    constructor(private options?: FullTransformOptions<TSource>) {
        super(options);
    }

    _transform(chunks: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<ArrayElementType<TSource>>) {
        const chunkClone = cloneDeep(chunks)
        try{
            chunks.forEach((chunk) => this.push(chunk));
            callback();
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