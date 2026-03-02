export type BaseType = string;

export type EndpointT<T extends string> = Record<T, string>;

export * from "./api";
export * from "./auth";

