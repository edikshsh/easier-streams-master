import { Transform, TransformCallback, TransformOptions } from "stream";
import { TypedTransform } from "../../types/typed-transform";
import { TypedTransformCallback } from "../../types/typed-transform-callback";

export class ArrayJoinTransform<TSource> extends Transform implements TypedTransform<TSource, TSource[]>{

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