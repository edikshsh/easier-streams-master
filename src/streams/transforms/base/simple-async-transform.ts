import cloneDeep from 'lodash.clonedeep';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { BaseTransform } from './base-transform';
import { TransformFunction } from './simple-transform';
import { TypedTransformCallback } from '../types/typed-transform-callback';
import { StreamError } from '../../errors/stream-error';
import { getFormattedChunk } from '../../utility/get-formatted-chunk';
import { onTransformError } from '../../utility/on-transform-error';

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
            const result = await this.transformer(chunk);
            return callback(null, result);
        } catch (error) {
            // const finalError = error instanceof Error ? error : new Error(`${error}`);
            // if (this.options?.errorStream) {
            //     const formattedChunk = getFormattedChunk(chunkClone, this.options);
            //     const streamError = new StreamError(finalError, formattedChunk);
            //     return callback(null, streamError as any);
            // }
            // return callback(finalError);
            return onTransformError(error, chunkClone,callback,this.options);
        }
    }
}