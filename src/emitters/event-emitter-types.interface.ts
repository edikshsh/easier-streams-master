import { PromisifyEventReturnType } from './Emitter';
import { IEvents } from './types';

export interface EventEmitterTypes<Events extends IEvents> {
    promisifyEvents<Key extends keyof Events, Key2 extends keyof Events>(
        resolveEvents: Key | Key[],
        rejectEvents?: Key2 | Key2[],
    ): PromisifyEventReturnType<Events, Key>;

    on<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this;

    addListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this;

    emit<Key extends keyof Events>(...args: [event: Key, ...params: Parameters<Events[Key]>]): boolean;

    off<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this;

    removeListener<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this;

    once<Key extends keyof Events>(eventName: Key, listener: Events[Key]): this;
}
