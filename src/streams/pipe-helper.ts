import { Transform } from "stream";
import { streamsManyToOneController } from "./utility/streams-many-to-one-controller";
import { ErrorTransform } from "./errors/error-transform";
import { objectTransformsHelper } from "./transforms-helper";
import { ErrorTransformOptions } from "./errors/error-transform-options.type";
import { TypedTransform } from "./transforms/typed-transform/typed-transform.interface";
import { filterOutStreamError } from "./errors/filter-out-stream-error";

type PipableTransformGroup<TSource, TDestination> = TypedTransform<TSource, TDestination> | TypedTransform<TSource, TDestination>[]
type TypedTransformPipe_02<T1, T2> = [PipableTransformGroup<T1, T2>]
type TypedTransformPipe_03<T1, T2, T3> = [...TypedTransformPipe_02<T1, T2>, PipableTransformGroup<T2, T3>]
type TypedTransformPipe_04<T1, T2, T3, T4> = [...TypedTransformPipe_03<T1, T2, T3>, PipableTransformGroup<T3, T4>]
type TypedTransformPipe_05<T1, T2, T3, T4, T5> = [...TypedTransformPipe_04<T1, T2, T3, T4>, PipableTransformGroup<T4, T5>]
type TypedTransformPipe_06<T1, T2, T3, T4, T5, T6> = [...TypedTransformPipe_05<T1, T2, T3, T4, T5>, PipableTransformGroup<T5, T6>]
type TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7> = [...TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>, PipableTransformGroup<T6, T7>]
type TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8> = [...TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>, PipableTransformGroup<T7, T8>]
type TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9> = [...TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>, PipableTransformGroup<T8, T9>]
type TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> = [...TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>, PipableTransformGroup<T9, T10>]
type TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = [...TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, PipableTransformGroup<T10, T11>]
type TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> = [...TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, PipableTransformGroup<T11, T12>]

class PipeHelper {

    pipe<T1, T2, T3>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_03<T1, T2, T3>): void
    pipe<T1, T2, T3, T4>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_04<T1, T2, T3, T4>): void
    pipe<T1, T2, T3, T4, T5>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_05<T1, T2, T3, T4, T5>): void
    pipe<T1, T2, T3, T4, T5, T6>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>): void
    pipe<T1, T2, T3, T4, T5, T6, T7>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>): void
    pipe<T1, T2, T3, T4, T5, T6, T7, T8>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>): void
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>): void
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>): void
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>): void
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>): void 
    pipe(options: ErrorTransformOptions<unknown>, ...transformGroups: PipableTransformGroup<unknown, unknown>[]): void {
        const source = transformGroups[0];
        if (!source) {
            throw Error('pipe helper cannot pipe')
        }
        let previousGroup = source

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

    pipeOneToOne<A, B, C>(srcTransform: TypedTransform<A, B>, destTransform: TypedTransform<B, C>, options?: ErrorTransformOptions<A>) {

        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream)
            this.pipeData([srcTransform], destTransform);
        } else {
            srcTransform.pipe(destTransform)
        }
        return { source: srcTransform, destination: destTransform };
    }

    pipeOneToMany<A, B, C>(srcTransform: TypedTransform<A, B>, destTransforms: TypedTransform<B, C>[], options?: ErrorTransformOptions<A>) {

        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream)
            destTransforms.forEach(destination => this.pipeData([srcTransform], destination));
        } else {
            destTransforms.forEach((destination) => srcTransform.pipe(destination));
        }
        return { source: srcTransform, destination: destTransforms };
    }

    pipeManyToOne<A, B, C>(srcTransforms: TypedTransform<A, B>[], destTransform: TypedTransform<B, C>, options?: ErrorTransformOptions<A>) {
        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors(srcTransforms, errorStream);
            this.pipeData(srcTransforms, destTransform);
        } else {
            srcTransforms.forEach(srcTransform => srcTransform.pipe(destTransform, { end: false }));
            this.abortTransformArrayIfOneFails(srcTransforms);
        }
        streamsManyToOneController(srcTransforms, destTransform);
        return { source: srcTransforms, destination: destTransform };
    }

    pipeManyToMany<A, B, C>(srcTransforms: TypedTransform<A, B>[], destTransforms: TypedTransform<B, C>[], options?: ErrorTransformOptions<A>) {
        if (srcTransforms.length !== destTransforms.length) {
            throw new Error(`pipeManyToMany: can't make connection ${srcTransforms.length} to ${destTransforms.length}`)
        }
        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors(srcTransforms, errorStream);
            srcTransforms.forEach((sourceTransform,index) => this.pipeData([sourceTransform], destTransforms[index]));
        } else {
            srcTransforms.forEach((srcTransform, index) => srcTransform.pipe(destTransforms[index]));
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
            source.on('error', () => otherSources.forEach(otherSource => otherSource.destroy()))
        });
    }

    private pipeErrors<TSource, TDestination>(sources: TypedTransform<TSource, TDestination>[], errorTransform: ErrorTransform<TSource>) {
        if (sources.length > 1) {
            streamsManyToOneController(sources, errorTransform);
        }        
        sources.forEach(source => source.pipe(errorTransform, {end: false}));
        errorTransform.pipeErrorSource(sources);
    }

    private pipeData<T1, T2, T3>(sources: TypedTransform<T1, T2>[], destination: TypedTransform<T2, T3>) {
        sources.forEach(source => source.pipe(objectTransformsHelper.filter(filterOutStreamError())).pipe(destination));
    }
}


export const pipeHelper = new PipeHelper();