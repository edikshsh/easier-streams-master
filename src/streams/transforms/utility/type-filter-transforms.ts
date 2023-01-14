import { SimpleAsyncTransform } from '../base/simple-async-transform';
import { SimpleTransform } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export function typeFilterTransform<TSource, TDestination extends TSource>(
    typeFilterFunction: (chunk: TSource) => chunk is TDestination,
    options?: FullTransformOptions<TSource>,
) {
    const filter = (chunk: TSource) => {
        try {
            return typeFilterFunction(chunk) ? chunk : undefined;
        } catch (error) {
            if (options?.errorStream) {
                throw error;
            }
            return undefined;
        }
    };
    return new SimpleTransform<TSource, TDestination>(filter, options);
}

// export function asyncFilterTransform<TSource, TDestination extends TSource>(typeFilterFunction: (chunk: TSource) => Promise<boolean>, options?: FullTransformOptions<TSource>) {
//     const filter = async (chunk: TSource) => {
//         try {
//             return (await filterFunction(chunk)) ? chunk : undefined
//         } catch (error) {
//             if (options?.errorStream) {
//                 throw error
//             }
//             return undefined;
//         }
//     }
//     return new SimpleAsyncTransform<TSource, TSource>(filter, options);
// }
