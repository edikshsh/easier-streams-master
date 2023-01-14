import { Readable, TransformOptions } from 'stream';
import { TypedPassThrough } from './typed-pass-through';

export function fromIterable<T>(iterable: Iterable<T> | AsyncIterable<T>, options?: TransformOptions) {
    return Readable.from(iterable).pipe(new TypedPassThrough<T>(options));
}
