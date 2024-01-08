import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {DynamoMarshallerTypes} from "./mashallTypes";
import {decoderFunctions, encoderFunctions, TypeMap} from "./objectFunctions";
import {DecoderError, EncoderError} from "./objectErrors";

export class DynamoDBObject<T> {
    private readonly _typeMap: TypeMap = {};
    // private isNative = false;

    constructor(public types: TypeMap) {
        this._typeMap = types;
    }

    public getTypeMap(): TypeMap {
        return this._typeMap;
    }

    public encode(obj: T): Record<string, AttributeValue> | undefined {
        return this.encodeObject(obj, this._typeMap);
    }

    public decode(obj: Record<string, AttributeValue>): T | undefined {
        return this.decodeObject(obj, this._typeMap);
    }


    private encodeObject(obj: any, scaffold: TypeMap): Record<string, AttributeValue> | undefined {
        const parsedObj: Record<string, AttributeValue> = {};

        for (const key in scaffold) {

            if (key === "*") {
                for (const subKey in obj) {
                    parsedObj[subKey] = { M: this.encodeObject(obj[subKey], scaffold[key] as TypeMap) };
                }

                continue;
            }

            if ((typeof obj[key] === "undefined" || obj[key] === null) && scaffold[key] !== DynamoMarshallerTypes.NULL) {
                obj[key] = encoderFunctions[DynamoMarshallerTypes.NULL](null);

                continue;
            }

            if (Array.isArray(scaffold[key])) {
                if (Array.isArray(obj[key])) {
                    for (const item of obj[key]) {
                        if (typeof item === "object") {
                            parsedObj[key] = { L: obj[key].map((item: any) => this.encodeObject(item, scaffold[key][0] as TypeMap)) };
                        } else {
                            parsedObj[key] = { L: obj[key].map((item: any) => encoderFunctions[scaffold[key][0] as DynamoMarshallerTypes](item)) };
                        }

                    }
                } else {
                    throw new EncoderError(`Cannot encode object, key ${key} is not an array`);
                }
                continue;
            }

            if (typeof scaffold[key] === "object") {
                if (typeof obj[key] === "object") {
                    parsedObj[key] = { M: this.encodeObject(obj[key], scaffold[key] as TypeMap) };
                } else {
                    throw new EncoderError(`Cannot encode object, key ${key} is not an object`);
                }
                continue;
            }

            for (const type in DynamoMarshallerTypes) {
                if (scaffold[key] === DynamoMarshallerTypes[type]) {
                    parsedObj[key] = encoderFunctions[DynamoMarshallerTypes[type]](obj[key]);
                }
            }

        }

        return parsedObj;
    }

    private decodeObject(obj: Record<string, AttributeValue>, scaffold: TypeMap): T | undefined {

        const parsedObj: any = {};

        if (!obj) {
            return undefined;
        }

        for (const key in scaffold) {

            if (key === "*") {
                if (typeof obj !== "object") {
                    throw new DecoderError(`Cannot decode object, key ${key} is not an object`);
                }

                for (const subKey in obj) {
                    parsedObj[subKey] = this.decodeObject(obj[subKey].M, scaffold[key] as TypeMap);
                }

                continue;
            }

            if (!obj[key]) {
                continue;
            }

            if (Array.isArray(scaffold[key])) {

                if (obj[key] && obj[key].L) {
                    if (typeof scaffold[key][0] === "object") {
                        parsedObj[key] = obj[key].L.map((item: any) => this.decodeObject(item, scaffold[key][0] as TypeMap));
                        continue;
                    }


                    console.log(scaffold[key][0])
                    console.log(obj[key].L)

                    parsedObj[key] = obj[key].L.map(item => decoderFunctions[scaffold[key][0]](item));
                } else {
                    throw new DecoderError(`Cannot decode object, key ${key} is not an array`);
                }
                continue;
            }

            if (typeof scaffold[key] === "object") {

                if (obj[key] && obj[key].M) {
                    parsedObj[key] = this.decodeObject(obj[key].M, scaffold[key] as TypeMap);
                } else {
                    throw new DecoderError(`Cannot decode object, key ${key} is not an object`);
                }
                continue;
            }

            for (const type in DynamoMarshallerTypes) {
                if (scaffold[key] === DynamoMarshallerTypes[type]) {

                    parsedObj[key] = decoderFunctions[DynamoMarshallerTypes[type]](obj[key]);
                }
            }
        }

        return parsedObj;

    }
}