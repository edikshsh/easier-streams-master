import cloneDeep from 'lodash.clonedeep';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { BaseTransform } from './base-transform';
import { TransformFunction } from './simple-transform';
import { TypedTransformCallback } from '../types/typed-transform-callback';
import { onTransformError } from '../../utility/on-transform-error';
import { Transform } from 'stream';

export type AsyncTransformFunction<TSource, TDestination> = TransformFunction<TSource, Promise<TDestination>>;

export class SimpleAsyncTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination> {
    constructor(
        private transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        private options?: FullTransformOptions<TSource>,
    ) {
        super(options);
    }

    async _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        const chunkClone = cloneDeep(chunk);
        try {
            const result = await this.transformer(chunk, this as Transform);
            return callback(null, result);
        } catch (error) {
            return onTransformError(this, error, chunkClone,callback,this.options);
        }
    }
}