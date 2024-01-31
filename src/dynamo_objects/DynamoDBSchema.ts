import {DynamoDBNull, DynamoDBType, DynamoDBTypes} from "./DynamoDBTypes";
import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {DynosaurusDecoderError as EncoderError, DynosaurusEncoderError as DecoderError} from "./objectErrors";

export class IDynosaurusSchemaDBSchema {
    [key: string]: DynamoDBType<any> | DynamoDBType<any>[] | IDynosaurusSchemaDBSchema | IDynosaurusSchemaDBSchema[];
}

export class DynosaurusSchema<T> {
    private readonly schema: IDynosaurusSchemaDBSchema;

    public constructor(schema: IDynosaurusSchemaDBSchema) {
        this.schema = schema;
    }

    public getSchema(): IDynosaurusSchemaDBSchema {
        return this.schema;
    }

    public getPartitionKey(): string {
        for (const key in this.schema) {
            if (this.schema[key] instanceof DynamoDBType && (this.schema[key] as DynamoDBType<any>).isPartitionKey()) {
                return key;
            }
        }

        throw new Error("No partition key found");
    }

    public getSortKey(): string | undefined {
        for (const key in this.schema) {
            if (this.schema[key] instanceof DynamoDBType && (this.schema[key] as DynamoDBType<any>).isSortKey()) {
                return key;
            }
        }

        return undefined;
    }

    public getKeyDynamoDBTypes(keyName: string): DynamoDBTypes {
        if (this.schema[keyName] instanceof DynamoDBType) {
            return (this.schema[keyName] as DynamoDBType<any>).getTypeID();
        }

        throw new Error(`Key ${keyName} is not a DynamoDBType`);
    }

    public encode(obj: T): Record<string, AttributeValue> | undefined {
        return this.encodeObject(obj, this.schema);
    }

    public decode(obj: Record<string, AttributeValue>): T | undefined {
        return this.decodeObject(obj, this.schema);
    }

    public encodeObject(obj: any, scaffold: IDynosaurusSchemaDBSchema): Record<string, AttributeValue> | undefined {
        const parsedObj: Record<string, AttributeValue> = {};

        for (const key in scaffold) {
            if (key === "*") {
                for (const subKey in obj) {
                    parsedObj[subKey] = { M: this.encodeObject(obj[subKey], (scaffold[key] as IDynosaurusSchemaDBSchema)) };
                }
                continue;
            }

            if ((typeof obj[key] === "undefined" || obj[key] === null) && scaffold[key] instanceof DynamoDBNull) {
                obj[key] = new DynamoDBNull().encode(null);
            }

            if (Array.isArray(scaffold[key])) {
                if (Array.isArray(obj[key])) {
                    if (scaffold[key][0] instanceof DynamoDBType) {
                        parsedObj[key] = { L: obj[key].map((item: any) => (scaffold[key][0] as DynamoDBType<any>).encode(item)) };

                        continue;
                    }


                    parsedObj[key] = { L:
                            obj[key].map((item: any) =>
                                ({M: this.encodeObject(item, scaffold[key][0])})
                            )
                    };

                    continue


                } else {
                    throw new EncoderError(`Cannot encode object, key ${key} is not an array`);
                }
            }

            if (scaffold[key] instanceof DynamoDBType) {
                parsedObj[key] = (scaffold[key] as DynamoDBType<any>).encode(obj[key])
                continue;
            }

            if ((typeof scaffold[key] === "object" && typeof obj[key] === "object")) {
                parsedObj[key] = { M: this.encodeObject(obj[key], (scaffold[key] as IDynosaurusSchemaDBSchema)) };
            } else {
                throw new EncoderError(`Cannot encode object, key ${key} is not an object`);
            }



        }

        return parsedObj;
    }


    private decodeObject(obj: Record<string, AttributeValue>, scaffold: IDynosaurusSchemaDBSchema): T | undefined {

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
                    parsedObj[subKey] = this.decodeObject(obj[subKey].M, scaffold[key] as IDynosaurusSchemaDBSchema);
                }

                continue;
            }

            if (!obj[key]) {
                continue;
            }

            if (Array.isArray(scaffold[key])) {
                if (obj[key] && obj[key].L) {
                    if (scaffold[key][0] instanceof DynamoDBType) {
                        parsedObj[key] = obj[key].L.map((item: any) => (scaffold[key][0] as DynamoDBType<any>).decode(item));
                        continue;
                    } else {
                        parsedObj[key] = obj[key].L.map((item: any) => (this.decodeObject(item.M, scaffold[key][0])));
                    }
                } else {
                    throw new DecoderError(`Cannot decode object, key ${key} is not an array`);
                }
                continue;
            }

            if (scaffold[key] instanceof DynamoDBType) {
                parsedObj[key] = (scaffold[key] as DynamoDBType<any>).decode(obj[key]);
            } else {
                if (obj[key] && obj[key].M) {
                    parsedObj[key] = this.decodeObject(obj[key].M, scaffold[key] as IDynosaurusSchemaDBSchema);
                } else {
                    throw new DecoderError(`Cannot decode object, key ${key} is not an object`);
                }
            }
        }

        return parsedObj;

    }
}