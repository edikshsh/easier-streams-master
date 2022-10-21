import { TransformOptions } from "stream";
import { BaseTransform } from "../base/base-transform";
import { TypedTransformCallback } from "../types/typed-transform-callback";


export class TypedPassThrough<T> extends BaseTransform<T, T>{
    constructor(options?:TransformOptions){
        super(options);
    }

    _transform(chunk: T, encoding: BufferEncoding, callback: TypedTransformCallback<T>): void {
        callback(null, chunk);
    }
}