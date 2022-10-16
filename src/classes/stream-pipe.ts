import { Transform } from "stream";
import { TypedEventEmitter } from "../emitters/Emitter";
import { TypedTransform } from "../types/typed-transform";

type StreamPipeEvents<T> = {
    data: (chunk: T) => void,
    end: () => void,
    finish: () => void,
    close: () => void,
    error: (error: Error) => void
}

/**
 * Deprecated
 * Use pipeHelper
 */
class StreamPipe<Tsource, Tdestination> extends TypedEventEmitter<StreamPipeEvents<Tdestination>> {

    constructor(private _source: TypedTransform<Tsource, unknown>,
        private _pipeline: Transform[],
        private _destination: TypedTransform<unknown, Tdestination>) {
        super();
        this.pipePipelineEventsToSelf();
        this.build();
    }

    private pipePipelineEventsToSelf(){
        this._destination.on('close', () => this.emit('close'))
        this._destination.on('end', () => this.emit('end'))
        this._destination.on('finish', () => this.emit('finish'))
        this._destination.on('data', (data) => this.emit('data', data))

        this._source.on('error', (error: Error) => this.emit('error', error))
        this._pipeline.forEach(transform => transform.on('error', (error: Error) => this.emit('error', error)));
        this._destination.on('error', (error: Error) => this.emit('error', error))
    }

    get source() { return this._source }
    get pipeline() { return [this._source, ...this._pipeline, this._destination] }
    get destination() { return this._destination }
    
    private build() {
        [...this._pipeline, this.destination].reduce((lastTranform, newTransform) => {
            return lastTranform.pipe(newTransform);
        }, this.source)
    }

    pipe<T extends StreamPipe<unknown, unknown>>(destination: T, options?: { end?: boolean | undefined; } | undefined): T {
        this.destination.pipe(destination.destination, options);
        return destination;
    }

    unpipe(destination?: StreamPipe<unknown, unknown>): this {
        this.destination.unpipe(destination?.destination);
        return this;
    }
}

/**
 * Deprecated.
 * Use pipeHelper
 */
export function getStreamPipe<T1, T2, T3>(...transforms: TypedTransformPipe_03<T1, T2, T3>): StreamPipe<T1, T3>
export function getStreamPipe<T1, T2, T3, T4>(...transforms: TypedTransformPipe_04<T1, T2, T3, T4>): StreamPipe<T1, T4>
export function getStreamPipe<T1, T2, T3, T4, T5>(...transforms: TypedTransformPipe_05<T1, T2, T3, T4, T5>): StreamPipe<T1, T5>
export function getStreamPipe<T1, T2, T3, T4, T5, T6>(...transforms: TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>): StreamPipe<T1, T6>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7>(...transforms: TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>): StreamPipe<T1, T7>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7, T8>(...transforms: TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>): StreamPipe<T1, T8>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(...transforms: TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>): StreamPipe<T1, T9>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(...transforms: TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>): StreamPipe<T1, T10>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(...transforms: TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>): StreamPipe<T1, T11>
export function getStreamPipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(...transforms: TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>): StreamPipe<T1, T12>
export function getStreamPipe(...transforms: TypedTransform<unknown, unknown>[]): StreamPipe<unknown, unknown> {
    return new StreamPipe(transforms[0], transforms.slice(1, transforms.length - 1), transforms[transforms.length - 1])
}

type TypedTransformPipe_02<T1, T2> = [TypedTransform<T1, T2>]
type TypedTransformPipe_03<T1, T2, T3> = [...TypedTransformPipe_02<T1, T2>, TypedTransform<T2, T3>]
type TypedTransformPipe_04<T1, T2, T3, T4> = [...TypedTransformPipe_03<T1, T2, T3>, TypedTransform<T3, T4>]
type TypedTransformPipe_05<T1, T2, T3, T4, T5> = [...TypedTransformPipe_04<T1, T2, T3, T4>, TypedTransform<T4, T5>]
type TypedTransformPipe_06<T1, T2, T3, T4, T5, T6> = [...TypedTransformPipe_05<T1, T2, T3, T4, T5>, TypedTransform<T5, T6>]
type TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7> = [...TypedTransformPipe_06<T1, T2, T3, T4, T5, T6>, TypedTransform<T6, T7>]
type TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8> = [...TypedTransformPipe_07<T1, T2, T3, T4, T5, T6, T7>, TypedTransform<T7, T8>]
type TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9> = [...TypedTransformPipe_08<T1, T2, T3, T4, T5, T6, T7, T8>, TypedTransform<T8, T9>]
type TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> = [...TypedTransformPipe_09<T1, T2, T3, T4, T5, T6, T7, T8, T9>, TypedTransform<T9, T10>]
type TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = [...TypedTransformPipe_10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, TypedTransform<T10, T11>]
type TypedTransformPipe_12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> = [...TypedTransformPipe_11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, TypedTransform<T11, T12>]
