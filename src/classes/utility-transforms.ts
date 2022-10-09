import cloneDeep from "lodash.clonedeep";
import { TransformOptions } from "stream";
import { AsyncTransformFunction, SimpleAsyncTransform } from "./simple-async-transform";
import { SimpleTransform, TransformFunction } from "./simple-transform";
import { TypedPassThrough } from "./TypedPassThrough";
import { ArrayJoinTransform } from "./utility-transforms/array-join-transform";
import { ArraySplitTransform } from "./utility-transforms/array-split-transform";

export class UtilityTransforms {
    constructor(private defaultTrasformOptions?: TransformOptions) { }

    private mergeOptions(options?: TransformOptions) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    arrayJoin<TSource>(length: number, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArrayJoinTransform<TSource>(length, finalOptions);
    }

    arraySplit<TSource>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArraySplitTransform<TSource[]>(finalOptions);
    }

    callOnDataSync<TSource>(functionToCallOnData: (data: TSource) => void,
        options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = (data: TSource) => {
            const dataCopy = cloneDeep(data);
            functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleTransform(callOnData, finalOptions);
    }

    callOnDataAsync<TSource>(functionToCallOnData: (data: TSource) => Promise<void>,
        options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = async (data: TSource) => {
            const dataCopy = cloneDeep(data);
            await functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleAsyncTransform(callOnData, finalOptions);
    }

    void<TSource>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, void>(() => undefined, finalOptions);
    }

    filter<TSource>(filterFunction: (chunk: TSource) => boolean, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const filter = (chunk: TSource) => {
            try {
                return filterFunction(chunk) ? chunk : undefined
            } catch {
                return undefined;
            }
        }
        return new SimpleTransform<TSource, TSource>(filter, finalOptions);
    }

    fromFunction<TSource, TDestination>(transformer: TransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, TDestination>(transformer, finalOptions);
    }

    fromAsyncFunction<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleAsyncTransform<TSource, TDestination>(transformer, finalOptions);
    }

    passThrough<T>(options?: TransformOptions){
        const finalOptions = this.mergeOptions(options);
        return new TypedPassThrough<T>(finalOptions)
    }

}

export const utilityTransforms = new UtilityTransforms();
export const objectUtilityTransforms = new UtilityTransforms({ objectMode: true });
