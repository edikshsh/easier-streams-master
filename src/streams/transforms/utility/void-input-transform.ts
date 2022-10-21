import { SimpleTransform } from "../base/simple-transform";
import { FullTransformOptions } from "../types/full-transform-options.type";


export function voidInputTransform<TSource>(options?: FullTransformOptions<TSource>) {
    return new SimpleTransform<TSource, void>(() => undefined, options);
}