import { Transform } from "stream";
import { TypedTransform } from "../types/typed-transform";
import { streamsManyToOneController } from "./concurrent-stream-output-ender";
import { ErrorTransform, filterOutStreamError, passStreamError } from "./error-stream";
import { objectUtilityTransforms } from "./utility-transforms";
import { ErrorTransformOptions } from "../types/error-transform-options.type";

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


    pipe<T1, T2, T3>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_03<T1, T2, T3>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T2, T3> }
    pipe<T1, T2, T3, T4>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_04<T1, T2, T3, T4>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T3, T4> }
    pipe<T1, T2, T3, T4, T5>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_05<T1, T2, T3, T4, T5>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T4, T5> }
    pipe<T1, T2, T3, T4, T5, T6>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T5, T6> }
    pipe<T1, T2, T3, T4, T5, T6, T7>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T6, T7> }
    pipe<T1, T2, T3, T4, T5, T6, T7, T8>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T7, T8> }
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T8, T9> }
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T9, T10> }
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T10, T11> }
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(options: ErrorTransformOptions<T1>, ...transformGroups: TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>): { source: PipableTransformGroup<T1, T2>, destination: PipableTransformGroup<T11, T12> }
    pipe(options: ErrorTransformOptions<unknown>, ...transformGroups: PipableTransformGroup<unknown, unknown>[]): { source: PipableTransformGroup<unknown, unknown>, destination: PipableTransformGroup<unknown, unknown> } {
        const source = transformGroups.shift();
        if (!source) {
            throw Error('pipe helper cannot pipe')
        }
        let previousGroup = source
        for (const currGroup of transformGroups) {
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
        return { source, destination: previousGroup }
    }

    pipeOneToOne<A, B, C>(srcTransform: TypedTransform<A, B>, destTransform: TypedTransform<B, C>, options?: ErrorTransformOptions<A>) {

        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream)
            srcTransform.pipe(objectUtilityTransforms.filter(filterOutStreamError(errorStream.id))).pipe(destTransform);
        } else {
            srcTransform.pipe(destTransform)
        }
        return { source: srcTransform, destination: destTransform };
    }

    pipeOneToMany<A, B, C>(srcTransform: TypedTransform<A, B>, destTransforms: TypedTransform<B, C>[], options?: ErrorTransformOptions<A>) {

        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors([srcTransform], errorStream)
            destTransforms.forEach(destination => srcTransform.pipe(objectUtilityTransforms.filter(filterOutStreamError(errorStream.id))).pipe(destination));
        } else {
            destTransforms.forEach((destination) => srcTransform.pipe(destination));
        }
        return { source: srcTransform, destination: destTransforms };
    }

    pipeManyToOne<A, B, C>(srcTransforms: TypedTransform<A, B>[], destTransform: TypedTransform<B, C>, options?: ErrorTransformOptions<A>) {
        const errorStream = options?.errorStream
        if (errorStream) {
            this.pipeErrors(srcTransforms, errorStream);
            const filters = srcTransforms.map(transform => transform.pipe(objectUtilityTransforms.filter(filterOutStreamError(errorStream.id))));
            filters.forEach(filter => filter.pipe(destTransform))
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
            const filters = srcTransforms.map(transform => transform.pipe(objectUtilityTransforms.filter(filterOutStreamError(errorStream.id))));
            filters.forEach((filter, index) => filter.pipe(destTransforms[index]))
        } else {
            srcTransforms.forEach((srcTransform, index) => srcTransform.pipe(destTransforms[index]));
            this.abortTransformArrayIfOneFails(srcTransforms);
        }
        return { source: srcTransforms, destination: destTransforms };
    }

    private abortTransformArrayIfOneFails(transforms: TypedTransform<unknown, unknown>[]){
        if(transforms.length === 1){
            return;
        }
        transforms.forEach((source, index) => {
            const otherSources = [...transforms.slice(0, index), ...transforms.slice(index + 1, transforms.length)];
            source.on('error', (error) => otherSources.forEach(otherSource => otherSource.destroy()))
        });
    }

    pipeErrors<TSource, TDestination>(sources: TypedTransform<TSource, TDestination>[], errorTransform: ErrorTransform<TSource>) {
        const id = errorTransform.id;
        const filters = sources.map(source => source.pipe(objectUtilityTransforms.filter(passStreamError(id))))
        if (sources.length > 1) {
            streamsManyToOneController(filters, errorTransform);
        }
        filters.forEach(filter => filter.pipe(errorTransform));
    }
}

export const pipeHelper = new PipeHelper();
