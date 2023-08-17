import { TransformCallback } from 'stream';
import { SimpleTransform, TransformFunction } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export function arrayJoinTransform<TSource>(length: number, options?: FullTransformOptions<TSource>) {
    let array: TSource[] = [];
    const transformer: TransformFunction<TSource, TSource[] | undefined> = (chunk) => {
        array.push(chunk);
        if (array.length >= length) {
            const tempArray = array;
            array = [];
            return tempArray;
        } else {
            return undefined;
        }
    };
    const optionsWithFlush: FullTransformOptions<TSource> = {
        ...options,
        flush: (callback: TransformCallback) => {
            callback(null, array.length ? array : undefined);
        },
    };
    return new SimpleTransform(transformer, optionsWithFlush);
}
