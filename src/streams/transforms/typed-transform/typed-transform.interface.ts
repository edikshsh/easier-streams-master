import { Transform } from 'stream';
import { TypedTransformCallback } from '../types/typed-transform-callback';

export interface TypedTransform<TSource, TDestination> extends Transform {
    _transform(
        chunk: TSource,
        encoding: BufferEncoding,
        callback: TypedTransformCallback<TDestination>,
    ): void | Promise<void>;
}
