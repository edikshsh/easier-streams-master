import { SimpleAsyncTransform } from '../base/simple-async-transform';
import { SimpleTransform } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export type FilterOptions = {
    considerErrorAsFilterOut?: boolean
}

export function filterTransform<TSource>(
    filterFunction: (chunk: TSource) => boolean,
    options?: FullTransformOptions<TSource> & FilterOptions,
) {
    const filter = (chunk: TSource) => {
        try {
            return filterFunction(chunk) ? chunk : undefined;
        } catch (error) {
            onFilterError(error,options?.considerErrorAsFilterOut)
            // if(options?.considerErrorAsFilterOut){
            //     return undefined
            // }
            // if (options?.errorStream) {
            //     throw error;
            // }
            // return undefined;
            // throw error;
        }
    };
    return new SimpleTransform<TSource, TSource>(filter, options);
}

export function asyncFilterTransform<TSource>(
    filterFunction: (chunk: TSource) => Promise<boolean>,
    options?: FullTransformOptions<TSource> & FilterOptions,
) {
    const filter = async (chunk: TSource) => {
        try {
            return (await filterFunction(chunk)) ? chunk : undefined;
        } catch (error) {
            onFilterError(error,options?.considerErrorAsFilterOut)

            // if (options?.errorStream) {
            //     throw error;
            // }
            // return undefined;

        }
    };
    return new SimpleAsyncTransform<TSource, TSource>(filter, options);
}


function onFilterError(error: unknown, considerErrorAsFilterOut?: boolean){
    if(considerErrorAsFilterOut){
        return undefined
    }
    // if (options?.errorStream) {
    //     throw error;
    // }
    // return undefined;
    throw error;

}