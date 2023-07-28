import { TransformCallback, TransformOptions } from 'stream';
import { BaseTransform } from '../base/base-transform';
import { SimpleTransform, TransformFunction } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { TypedTransformCallback } from '../types/typed-transform-callback';

export class ArrayJoinTransform<TSource> extends BaseTransform<TSource, TSource[]> {
    array: TSource[] = [];
    constructor(private length: number, options?: TransformOptions) {
        super(options);
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TSource[]>) {
        this.array.push(chunk);
        if (this.array.length >= this.length) {
            callback(null, this.array);
            this.array = [];
        } else {
            callback();
        }
    }

    _flush(callback: TransformCallback): void {
        callback(null, this.array.length ? this.array : undefined);
    }
}

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
