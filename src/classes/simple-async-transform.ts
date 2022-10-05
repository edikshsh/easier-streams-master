import { Transform, TransformOptions } from "stream";
import { TypedTransform } from "../types/typed-transform";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { BaseTransform } from "./base-transform";
import { TransformFunction } from "./simple-transform";

type AsyncTransformFunction<TSource, TDestination> = TransformFunction<TSource, Promise<TDestination>>;

export class SimpleAsyncTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination>{

    constructor(private transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        super(options);
    }

    async _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>) {
        try {
            const result = await this.transformer(chunk);
            callback(null, result);
        }
        catch (error) {
            if (error instanceof Error) {
                callback(error);
            } else {
                callback(new Error(`${error}`));
            }
        }
        finally {
        }
    }
}