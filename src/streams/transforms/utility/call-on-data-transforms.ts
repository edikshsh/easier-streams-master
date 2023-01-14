import cloneDeep from 'lodash.clonedeep';
import { SimpleAsyncTransform } from '../base/simple-async-transform';
import { SimpleTransform } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export function callOnDataSyncTransform<TSource>(
    functionToCallOnData: (data: TSource) => void,
    options?: FullTransformOptions<TSource>,
) {
    const callOnData = (data: TSource) => {
        const dataCopy = cloneDeep(data);
        functionToCallOnData(dataCopy);
        return data;
    };
    return new SimpleTransform(callOnData, options);
}

export function callOnDataAsyncTransform<TSource>(
    functionToCallOnData: (data: TSource) => Promise<void>,
    options?: FullTransformOptions<TSource>,
) {
    const callOnData = async (data: TSource) => {
        const dataCopy = cloneDeep(data);
        await functionToCallOnData(dataCopy);
        return data;
    };
    return new SimpleAsyncTransform(callOnData, options);
}
