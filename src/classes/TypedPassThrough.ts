import { TransformCallback, TransformOptions } from "stream";
import { BaseTransform } from "./base-transform";

export class TypedPassThrough<TSource, TDestination> extends BaseTransform<TSource, TDestination>{
    constructor(options?:TransformOptions){
        super(options);
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        callback(null, chunk);
    }
}