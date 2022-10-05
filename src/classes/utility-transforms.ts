import cloneDeep from "lodash.clonedeep";
import { TransformOptions } from "stream";
import { SimpleAsyncTransform } from "./simple-async-transform";
import { SimpleTransform } from "./simple-transform";
import { ArrayJoinTransform } from "./utility-transforms/array-join-transform";
import { ArraySplitTransform } from "./utility-transforms/array-split-transform";

type PassedFunctionOptions = {
    shouldBeAwaited: boolean;
}

export class UtilityTransforms {
    constructor(private defaultTrasformOptions?: TransformOptions) { }

    private mergeOptions(options?: TransformOptions) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    arrayJoin<TSource>(length: number, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArrayJoinTransform<TSource>(length, finalOptions);
    }

    arraySplit<TSource extends any[]>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArraySplitTransform<TSource>(finalOptions);
    }

    // When we pass an async function, we sometimes want to wait for it to finish, and sometimes to push to an array and wait with promise.all
    // Sometimes we can pass a regular function that returns a promise, so we dont know 100% when to wait
    callOnData<TSource>(functionToCallOnData: (data: TSource) => (void | Promise<void>),
     options?: { transformOptions?: TransformOptions; functionOptions?: PassedFunctionOptions }) {
        const finalOptions = this.mergeOptions(options?.transformOptions);
        const shouldBeAwaited = options?.functionOptions?.shouldBeAwaited;
        if (shouldBeAwaited){
            const callOnData = async (data: TSource) => {
                const dataCopy = cloneDeep(data);
                await functionToCallOnData(dataCopy);
                return data;
            }
            return new SimpleAsyncTransform(callOnData,finalOptions);
        } else {
            const callOnData = (data: TSource) => {
                const dataCopy = cloneDeep(data);
                functionToCallOnData(dataCopy);
                return data;
            }
            return new SimpleTransform(callOnData,finalOptions);
        }
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

    fromFunction<TSource, TDestination>(...[transformer , options]: ConstructorParameters<typeof SimpleTransform<TSource, TDestination>>){
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, TDestination>(transformer , finalOptions);
    }

    fromAsyncFunction<TSource, TDestination>(...[transformer , options]: ConstructorParameters<typeof SimpleAsyncTransform<TSource, TDestination>>){
        const finalOptions = this.mergeOptions(options);
        return new SimpleAsyncTransform<TSource, TDestination>(transformer, finalOptions);
    }
}

export const utilityTransforms = new UtilityTransforms();
export const objectUtilityTransforms = new UtilityTransforms({ objectMode: true });
