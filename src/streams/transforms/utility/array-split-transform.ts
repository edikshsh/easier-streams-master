import { FullTransformOptions } from '../types/full-transform-options.type';
import { TypedTransformCallback } from '../types/typed-transform-callback';
import cloneDeep from 'lodash.clonedeep';
import { BaseTransform } from '../base/base-transform';
import { StreamError } from '../../errors/stream-error';

type ArrayElementType<T extends unknown[]> = T extends (infer U)[] ? U : never;

export class ArraySplitTransform<TSource extends unknown[]> extends BaseTransform<TSource, ArrayElementType<TSource>> {
    constructor(private options?: FullTransformOptions<TSource>) {
        super(options);
    }

    _transform(chunks: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<ArrayElementType<TSource>>) {
        const chunkClone = cloneDeep(chunks);
        try {
            chunks.forEach((chunk) => this.push(chunk));
            callback();
        } catch (error) {
            const finalError = error instanceof Error ? error : new Error(`${error}`);
            if (this.options?.errorStream) {
                const streamError = new StreamError(finalError, chunkClone);
                return callback(null, streamError as any);
            }
            return callback(finalError);
        }
    }
}
