import { Transform } from "stream";
import { PromisifyEventReturnType, TupleToUnion } from "../emitters/Emitter";
import { IEvents } from "../emitters/types";
import { TypedTransformCallback } from "./typed-transform-callback";

export type TransformEvents<T> = {
    data: (chunk: T) => void,
    end: () => void,
    close: () => void,
    error: (error: Error) => void,
    pause: () => void,
    readable: () => void,
    resume: () => void,
} 

export interface TypedTransform<TSource, TDestination> extends Transform{
    _transform(
        chunk: TSource,
        encoding: BufferEncoding,
        callback: TypedTransformCallback<TDestination>,
    ): void | Promise<void>;

}

export interface EventEmitterTypes<Events extends IEvents> {
    promisifyEvents<Key extends keyof Events, Key2 extends keyof Events>(resolveEvents: Key[], rejectEvents?: Key2[]):PromisifyEventReturnType<Events,Key>

    on<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this

    addListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this

    emit<Key extends keyof Events>(...args:[event: Key, ...params: Parameters<Events[Key]>]): boolean

    off<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this

    removeListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this

    once<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
}


class Tasdasd extends Transform {
// on(event: "close", listener: () => void): this;
// on(event: "data", listener: (chunk: any) => void): this;
// on(event: "end", listener: () => void): this;
// on(event: "error", listener: (err: Error) => void): this;
// on(event: "pause", listener: () => void): this;
// on(event: "readable", listener: () => void): this;
// on(event: "resume", listener: () => void): this;
// on(event: string | symbol, listener: (...args: any[]) => void): this;
// on(event: unknown, listener: unknown): this {
    
// }
}