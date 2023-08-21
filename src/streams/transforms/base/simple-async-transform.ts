import cloneDeep from 'lodash.clonedeep';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { BaseTransform } from './base-transform';
import { TransformFunction } from './simple-transform';
import { TypedTransformCallback } from '../types/typed-transform-callback';
import { onTransformError } from '../../utility/on-transform-error';

export type AsyncTransformFunction<TSource, TDestination> = TransformFunction<TSource, Promise<TDestination>>;

export class SimpleAsyncTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination> {
    constructor(
        private transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        private options?: FullTransformOptions<TSource>,
    ) {
        super(options);
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk);
        this.transformer(chunk, this)
            .then((result) => callback(null, result))
            .catch((error) => onTransformError(this, error, chunkClone, callback, this.options));
    }
}
