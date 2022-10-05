export type EventFunction = (...args: any[]) => void
export type GenericEventItem = [event: string, func: EventFunction]
export type EventItem<Str extends string, Func extends EventFunction> = [event: Str, func: Func]
export type EventItemEvent<EE extends GenericEventItem> = EE extends [infer R, any] ? R : any
export type EventItemFunc<EE extends GenericEventItem> = EE extends [any, infer R] ? R : EventFunction
export type AllEvents<Items extends GenericEventItem[]> = Items extends [infer R, any][] ? R : any;
export type FirstArg<Func extends (...args: any[]) => any> = Func extends (arg1: infer R, ...args : any[]) => any ? R: never

export type IEvents = Record<string | symbol, EventFunction>
