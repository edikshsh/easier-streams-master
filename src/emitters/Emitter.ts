import { EventEmitter } from "stream";
import { eventPromisifier } from "./eventPromisifier";
import { IPromisifiableEvents } from "./promisifiableEvents";
import { IEvents } from "./types";
export type TupleToUnion<T extends unknown[]> = T[number];
export type PromisifyEventReturnType<Events extends IEvents, Key extends keyof Events> = TupleToUnion<Parameters<Events[Key]>> extends never ? Promise<void> : Promise<TupleToUnion<Parameters<Events[Key]>>>

export class TypedEventEmitter<Events extends IEvents> extends EventEmitter implements IPromisifiableEvents{

    promisifyEvents<Key extends keyof Events, Key2 extends keyof Events>(resolveEvents: Key[], rejectEvents?: Key2[]):PromisifyEventReturnType<Events, Key> {
        const stringResolveEvents = resolveEvents.map(event => event.toString())
        const stringRejectEvents = rejectEvents?.map(event => event.toString())
        return eventPromisifier._promisifyEvents(this, stringResolveEvents, stringRejectEvents) as PromisifyEventReturnType<Events, Key>
    }

    on<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
    on(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.on(eventName.toString(), listener);
    }

    addListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
    addListener(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.addListener(eventName, listener);
    }

    emit<Key extends keyof Events>(...args:[event: Key, ...params: Parameters<Events[Key]>]): boolean
    emit(eventName: string | symbol, ...args: unknown[]): boolean {
        return super.emit(eventName, ...args);
    }

    off<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
    off(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.off(eventName, listener);
    }

    removeListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
    removeListener(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.removeListener(eventName, listener);
    }

    once<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this
    once(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.once(eventName, listener);
    }
}