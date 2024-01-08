import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {DynamoMarshallerTypes} from "./mashallTypes";

export type TypeMap = {
    [key: string]: DynamoMarshallerTypes | DynamoMarshallerTypes[] | TypeMap | TypeMap[];
}

type EncoderFunction = (data?: any, encoderFunc?: (obj: any) => Record<string, AttributeValue>) => AttributeValue;

type EncoderFunctionMap = {
    [key in DynamoMarshallerTypes]: EncoderFunction;
};

type DecoderFunction = (data?: AttributeValue) => any;

type DecoderFunctionMap = {
    [key in DynamoMarshallerTypes]: DecoderFunction;
}

export const encoderFunctions: EncoderFunctionMap = {
    [DynamoMarshallerTypes.STRING]: (data: string) => ({S: data}),
    [DynamoMarshallerTypes.NUMBER]: (data: string) => ({N: data.toString()}),
    [DynamoMarshallerTypes.BINARY]: (data: string) => ({B: Buffer.from(data)}),
    [DynamoMarshallerTypes.BOOLEAN]: (data: boolean) => ({BOOL: data}),
    [DynamoMarshallerTypes.NULL]: (_: null) => ({NULL: true}),
    [DynamoMarshallerTypes.SET]: (data: string[]) => ({SS: data}),
    [DynamoMarshallerTypes.NUMBER_SET]: (data: string[]) => ({NS: data.map((n) => n.toString())}),
    [DynamoMarshallerTypes.BINARY_SET]: (data: string[]) => ({ BS: data.map((n) => Buffer.from(n))}),
}

export const decoderFunctions: DecoderFunctionMap = {
    [DynamoMarshallerTypes.STRING]: (data: AttributeValue) => data.S,
    [DynamoMarshallerTypes.NUMBER]: (data: AttributeValue) => data.N,
    [DynamoMarshallerTypes.BINARY]: (data: AttributeValue) => data.B,
    [DynamoMarshallerTypes.BOOLEAN]: (data: AttributeValue) => data.BOOL,
    [DynamoMarshallerTypes.NULL]: (_: null) => null,
    [DynamoMarshallerTypes.SET]: (data: AttributeValue) => data.SS,
    [DynamoMarshallerTypes.NUMBER_SET]: (data: AttributeValue) => data.NS,
    [DynamoMarshallerTypes.BINARY_SET]: (data: AttributeValue) => data.BS,

}

