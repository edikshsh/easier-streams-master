import { TransformOptions } from "stream";
import { v4 } from "uuid";
import { TypedTransform } from "../types/typed-transform";
import { TypedTransformCallback } from "../types/typed-transform-callback";
import { BaseTransform } from "./base-transform";

export type StreamError<T> = {
    id: string,
    error: Error,
    data: T;
}

export function passStreamError(id: string) {
    return (streamError: StreamError<unknown>) => {
        return (!!streamError.id) && (streamError.id === id);
    }
}

export function filterOutStreamError(id: string) {
    return (streamError: StreamError<unknown>) => {
        // debugger;
        return !(passStreamError(id))(streamError)
    };
}

// export class ErrorTransform<TSource> extends BaseTransform<StreamError<TSource>, unknown>{

// }

// export type ErrorTransform<TSource> = TypedTransform<StreamError<TSource>, unknown> & {id: string}

export class ErrorTransform<TSource> extends BaseTransform<StreamError<TSource>, StreamError<TSource>> {
    id: string;
    constructor(options?: TransformOptions) {
        super(options);
        this.id = v4()
    }

    _transform(chunk: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TSource>) {
        callback(null, chunk);
    }
}