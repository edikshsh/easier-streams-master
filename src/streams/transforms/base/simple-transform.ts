import cloneDeep from 'lodash.clonedeep';
import { StreamError } from '../../errors/stream-error';
import { TypedTransform } from '../typed-transform/typed-transform.interface';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { TypedTransformCallback } from '../types/typed-transform-callback';
import { BaseTransform } from './base-transform';

export type TransformFunction<TSource, TDestination> = (item: TSource) => TDestination;

export class SimpleTransform<TSource, TDestination>
    extends BaseTransform<TSource, TDestination>
    implements TypedTransform<TSource, TDestination>
{
    constructor(
        private transformer: TransformFunction<TSource, TDestination | undefined>,
        private options?: FullTransformOptions<TSource>,
    ) {
        super(options);
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk);
        try {
            const result = this.transformer(chunk);
            callback(null, result);
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
