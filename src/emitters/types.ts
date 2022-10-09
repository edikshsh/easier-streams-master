export type EventFunction = (...args: any[]) => void
export type GenericEventItem = [event: string, func: EventFunction]
export type EventItem<Str extends string, Func extends EventFunction> = [event: Str, func: Func]
export type EventItemEvent<EE extends GenericEventItem> = EE extends [infer R, unknown] ? R : unknown
export type EventItemFunc<EE extends GenericEventItem> = EE extends [unknown, infer R] ? R : EventFunction
export type AllEvents<Items extends GenericEventItem[]> = Items extends [infer R, unknown][] ? R : unknown;
export type FirstArg<Func extends (...args: unknown[]) => unknown> = Func extends (arg1: infer R, ...args : unknown[]) => unknown ? R: never

export type IEvents = Record<string | symbol, EventFunction>
