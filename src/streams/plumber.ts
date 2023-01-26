import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { getDefaultEventCounter, streamsManyToOneController } from './utility/streams-many-to-one-controller';
import { ErrorTransform } from './errors/error-transform';
import { TypedTransform } from './transforms/typed-transform/typed-transform.interface';
import { filterOutStreamError } from './errors/filter-out-stream-error';
import { transformer } from './transformer';
import { PlumberOptions } from './utility/plumber-options.type';

type PipableTransformGroup<TSource, TDestination> =
    | TypedTransform<TSource, TDestination>
    | TypedTransform<TSource, TDestination>[];

type TypedTransformPipe_v2_02<T1, T2> = [PipableTransformGroup<T1, T2>];
type TypedTransformPipe_v2_03<T1, T2, T3 extends T2, T4> = [
    ...TypedTransformPipe_v2_02<T1, T2>,
    PipableTransformGroup<T3, T4>,
];
type TypedTransformPipe_v2_04<T1, T2, T3 extends T2, T4, T5 extends T4, T6> = [
    ...TypedTransformPipe_v2_03<T1, T2, T3, T4>,
    PipableTransformGroup<T5, T6>,
];
type TypedTransformPipe_v2_05<T1, T2, T3 extends T2, T4, T5 extends T4, T6, T7 extends T6, T8> = [
    ...TypedTransformPipe_v2_04<T1, T2, T3, T4, T5, T6>,
    PipableTransformGroup<T7, T8>,
];

function noop(...args: unknown[]) {
    return undefined;
}

type TypedTransformPipe_02<T1, T2> = [PipableTransformGroup<T1, T2>];
type TypedTransformPipe_03<T1, T2, T3> = [...TypedTransformPipe_02<T1, T2>, PipableTransformGroup<T2, T3>];
type TypedTransformPipe_04<T1, T2, T3, T4> = [...TypedTransformPipe_03<T1, T2, T3>, PipableTransformGroup<T3, T4>];
type TypedTransformPipe_05<T1, T2, T3, T4, T5> = [
    ...TypedTransformPipe_04<T1, T2, T3, T4>,
    PipableTransformGroup<T4, T5>,
];
type TypedTransformPipe_06<T1, T2, T3, T4, T5, T6> = [
    ...TypedTransformPipe_05<T1, T2, T3, T4, T5>,
    PipableTransformGroup<T5, T6>,
];
type TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7> = [
    ...TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>,
    PipableTransformGroup<T6, T7>,
];
type TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8> = [
    ...TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>,
    PipableTransformGroup<T7, T8>,
];
type TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9> = [
    ...TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>,
    PipableTransformGroup<T8, T9>,
];
type TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> = [
    ...TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>,
    PipableTransformGroup<T9, T10>,
];
type TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = [
    ...TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>,
    PipableTransformGroup<T10, T11>,
];
type TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> = [
    ...TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>,
    PipableTransformGroup<T11, T12>,
];

export class Plumber {

    constructor(private muteWarnings: boolean){}
    pipe<T1, T2, T3>(options: PlumberOptions<T1>, ...transformGroups: TypedTransformPipe_03<T1, T2, T3>): void;
    pipe<T1, T2, T3, T4>(options: PlumberOptions<T1>, ...transformGroups: TypedTransformPipe_04<T1, T2, T3, T4>): void;
    pipe<T1, T2, T3, T4, T5>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_05<T1, T2, T3, T4, T5>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7, T8>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>
    ): void;
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
        options: PlumberOptions<T1>,
        ...transformGroups: TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>
    ): void;
    pipe(options: PlumberOptions<unknown>, ...transformGroups: PipableTransformGroup<unknown, unknown>[]): void {
        const source = transformGroups[0];
        if (!source) {
            throw Error('pipe helper cannot pipe');
        }
        let previousGroup = source;

        for (const currGroup of transformGroups.slice(1)) {
            if (!previousGroup) break;
            if (previousGroup instanceof Transform) {
                if (currGroup instanceof Transform) {
                    previousGroup = this.pipeOneToOne(previousGroup, currGroup, options).destination;
                } else {
                    previousGroup = this.pipeOneToMany(previousGroup, currGroup, options).destination;
                }
            } else {
                if (currGroup instanceof Transform) {
                    previousGroup = this.pipeManyToOne(previousGroup, currGroup, options).destination;
                } else {
                    previousGroup = this.pipeManyToMany(previousGroup, currGroup, options).destination;
                }
            }
        }
    }

    pipeOneToOne<A, B, C>(
        srcTransform: TypedTransform<A, B>,
        destTransform: TypedTransform<B, C>,
        plumberOptions?: PlumberOptions<A>,
    ) {
        const errorStream = plumberOptions?.errorStream;
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream, plumberOptions);
            this.pipeData([srcTransform], destTransform, plumberOptions);
        } else {
            this.chosenPipingFunction(srcTransform, destTransform, plumberOptions, {chainErrors: true});
        }
        return { source: srcTransform, destination: destTransform };
    }

    pipeOneToMany<A, B, C>(
        srcTransform: TypedTransform<A, B>,
        destTransforms: TypedTransform<B, C>[],
        plumberOptions?: PlumberOptions<A>,
    ) {
        const errorStream = plumberOptions?.errorStream;
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream, plumberOptions);
            destTransforms.forEach((destination) => this.pipeData([srcTransform], destination, plumberOptions));
        } else {
            destTransforms.forEach((destination) =>
                this.chosenPipingFunction(srcTransform, destination, plumberOptions, {chainErrors: true}),
            );
        }
        return { source: srcTransform, destination: destTransforms };
    }

    pipeManyToOne<A, B, C>(
        srcTransforms: TypedTransform<A, B>[],
        destTransform: TypedTransform<B, C>,
        plumberOptions?: PlumberOptions<A>,
    ) {
        const errorStream = plumberOptions?.errorStream;
        const eventCounter = getDefaultEventCounter()
        if (errorStream) {
            this.pipeErrors(srcTransforms, errorStream, plumberOptions);
            this.pipeData(srcTransforms, destTransform, plumberOptions);
        } else {
            srcTransforms.forEach((srcTransform) =>
                this.chosenPipingFunction(srcTransform, destTransform, plumberOptions, { end: false}),
            );
            this.abortTransformArrayIfOneFails(srcTransforms);
            eventCounter.error = srcTransforms.length - 1;
        }
        streamsManyToOneController(srcTransforms, destTransform, eventCounter);
        return { source: srcTransforms, destination: destTransform };
    }

    pipeManyToMany<A, B, C>(
        srcTransforms: TypedTransform<A, B>[],
        destTransforms: TypedTransform<B, C>[],
        plumberOptions?: PlumberOptions<A>,
    ) {
        if (srcTransforms.length !== destTransforms.length) {
            throw new Error(
                `pipeManyToMany: can't make connection ${srcTransforms.length} to ${destTransforms.length}`,
            );
        }
        const errorStream = plumberOptions?.errorStream;
        if (errorStream) {
            this.pipeErrors(srcTransforms, errorStream, plumberOptions);
            srcTransforms.forEach((sourceTransform, index) =>
                this.pipeData([sourceTransform], destTransforms[index], plumberOptions),
            );
        } else {
            srcTransforms.forEach((srcTransform, index) =>
                this.chosenPipingFunction(srcTransform, destTransforms[index], plumberOptions, {chainErrors: true}),
            );
            this.abortTransformArrayIfOneFails(srcTransforms);
        }
        return { source: srcTransforms, destination: destTransforms };
    }

    private abortTransformArrayIfOneFails(transforms: TypedTransform<unknown, unknown>[]) {
        if (transforms.length === 1) {
            return;
        }
        transforms.forEach((source, index) => {
            const otherSources = [...transforms.slice(0, index), ...transforms.slice(index + 1, transforms.length)];
            source.on('error', (error) => otherSources.forEach((otherSource) => otherSource.destroy(error)));
        });
    }

    private pipeErrors<TSource, TDestination>(
        sources: TypedTransform<TSource, TDestination>[],
        errorTransform: ErrorTransform<TSource>,
        plumberOptions: PlumberOptions<TSource>,
    ) {
        if (sources.length > 1) {
            streamsManyToOneController(sources, errorTransform);
        }
        sources.forEach((source) => this.chosenPipingFunction(source, errorTransform, plumberOptions, { end: false }));
        errorTransform.pipeErrorSource(sources);
    }

    private pipeData<T1, T2, T3>(
        sources: TypedTransform<T1, T2>[],
        destination: TypedTransform<T2, T3>,
        plumberOptions: PlumberOptions<T1>,
    ) {
        sources.forEach((source) => {
            const errorFilter = transformer.filter(filterOutStreamError()) as Transform; //TODO: fix type
            this.chosenPipingFunction(source, errorFilter, plumberOptions, {chainErrors: true});
            this.chosenPipingFunction(errorFilter, destination, plumberOptions, {chainErrors: true});
        });
    }

    private chosenPipingFunction<T1, T2, T3>(
        source: TypedTransform<T1, T2>,
        destination: TypedTransform<T2, T3>,
        plumberOptions?: PlumberOptions<T1>,
        options?: { end?: boolean, chainErrors?: boolean },
    ) {
        if (plumberOptions?.usePipeline) {
            return this.pipingFunctionPipeline(source, destination, options);
        }
        return this.pipingFunctionPipe(source, destination, options);
    }

    private pipingFunctionPipe<T1, T2, T3>(
        source: TypedTransform<T1, T2>,
        destination: TypedTransform<T2, T3>,
        options?: { end?: boolean, chainErrors?: boolean },
    ) {
        source.pipe(destination, options);
        if(options?.chainErrors){
            source.on('error', (error) => destination.destroy(error));
        }
        return destination;
    }

    // TODO: find an alternative to the missing "end" parameter
    // because new piping method lacks the "end" option, stream might end prematurely when connected to more than 1 stream.
    // Example: a => async b => c, where all of them are connected to an error stream e.
    // a ends, thus ending b and e.
    // e will end before b, so if b throws after that, e wont catch the error.
    private pipingFunctionPipeline<T1, T2, T3>(
        source: TypedTransform<T1, T2>,
        destination: TypedTransform<T2, T3>,
        options?: { end?: boolean },
    ) {
        if (options?.end === false) {
            if(!this.muteWarnings){
                console.warn("pipeline doesn't support {end: false} option, using pipe instead");
            }
            return this.pipingFunctionPipe(source, destination, options);
        }
        pipeline(source, destination).catch(noop);
        return destination;
    }
}

export const plumber = new Plumber(false);
