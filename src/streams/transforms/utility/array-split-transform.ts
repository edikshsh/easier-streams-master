import { FullTransformOptions } from '../types/full-transform-options.type';
import { SimpleTransform, TransformFunction } from '../base/simple-transform';

type ArrayElementType<T extends unknown[]> = T extends (infer U)[] ? U : never;


export function arraySplitTransform<TSource extends unknown[]>(options?: FullTransformOptions<TSource>){
    const transformer: TransformFunction<TSource, ArrayElementType<TSource>> = (chunks, transform) => {
        chunks.forEach((chunk) => transform.push(chunk));
        return undefined as ArrayElementType<TSource>
    };
    return new SimpleTransform(transformer,options)
}