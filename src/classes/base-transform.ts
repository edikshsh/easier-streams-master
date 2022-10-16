import { Transform, TransformOptions } from "stream";
import { PromisifyEventReturnType } from "../emitters/Emitter";
import { eventPromisifier } from "../emitters/eventPromisifier";
import { EventEmitterTypes, TransformEvents, TypedTransform } from "../types/typed-transform";

export class BaseTransform<TSource, TDestination> extends Transform implements TypedTransform<TSource, TDestination>, EventEmitterTypes<TransformEvents<TDestination>>{
    constructor(options?: TransformOptions){
        super(options);
    }

    private isSingleKey<Key extends keyof TransformEvents<TDestination>>(keys?: Key | Key[]): keys is Key {
        return typeof keys === 'string' || typeof keys === 'symbol'
    }

    private keysToStringArray<Key extends keyof TransformEvents<TDestination>>(keys?: Key | Key[]){
        if(this.isSingleKey(keys)){
            return [keys.toString()];
        } else {
            return  keys?.map(event => event.toString()) || [];
        }
    }
    
    promisifyEvents<Key extends keyof TransformEvents<TDestination>, Key2 extends keyof TransformEvents<TDestination>>(resolveEvents: Key | Key[], rejectEvents?: Key2 | Key2[]): PromisifyEventReturnType<TransformEvents<TDestination>,Key> {

        return eventPromisifier._promisifyEvents(this, this.keysToStringArray(resolveEvents),this.keysToStringArray(rejectEvents)) as PromisifyEventReturnType<TransformEvents<TDestination>,Key>
    }

    on<Key extends keyof TransformEvents<TDestination>>(eventName: Key, listener: TransformEvents<TDestination>[Key]): this
    on(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.on(eventName.toString(), listener);
    }

    addListener<Key extends keyof TransformEvents<TDestination>>(eventName: Key, listener: TransformEvents<TDestination>[Key]): this
    addListener(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.addListener(eventName, listener);
    }

    emit<Key extends keyof TransformEvents<TDestination>>(...args:[event: Key, ...params: Parameters<TransformEvents<TDestination>[Key]>]): boolean
    emit(eventName: string | symbol, ...args: unknown[]): boolean {
        return super.emit(eventName, ...args);
    }

    off<Key extends keyof TransformEvents<TDestination>>(eventName: Key, listener: TransformEvents<TDestination>[Key]): this
    off(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.off(eventName, listener);
    }

    removeListener<Key extends keyof TransformEvents<TDestination>>(eventName: Key, listener: TransformEvents<TDestination>[Key]): this
    removeListener(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.removeListener(eventName, listener);
    }

    once<Key extends keyof TransformEvents<TDestination>>(eventName: Key, listener: TransformEvents<TDestination>[Key]): this
    once(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
        return super.once(eventName, listener);
    }
}