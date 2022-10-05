import { TransformOptions } from "stream";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { BaseTransform } from "./base-transform";

export type TransformFunction<TSource, TDestination> = (item: TSource) => TDestination;

export class SimpleTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination>{

    constructor(private transformer: TransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        super(options);
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        try {
            const result = this.transformer(chunk);
            callback(null, result);
        }
        catch (error) {
            if (error instanceof Error) {
                callback(error);
            } else {
                callback(new Error(`${error}`));
            }
        }
    }
}