import { Transform, TransformOptions } from "stream";
import { TypedTransform } from "../../types/typed-transform";
import { TypedTransformCallback } from "../../types/typed-transform-callback";
import { BaseTransform } from "../base-transform";


type ArrayElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export class ArraySplitTransform<TSource extends any[]> extends BaseTransform<TSource, ArrayElementType<TSource>>{
    constructor(options?: TransformOptions) {
        super(options);
    }

    _transform(chunks: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<ArrayElementType<TSource>>) {
        try{
            chunks.forEach((chunk) => this.push(chunk));
            callback();
        } catch (error){
            if(error instanceof Error){
                callback(error);
            } else {
                callback(new Error(`${error}`));
            }
        }
    }
}