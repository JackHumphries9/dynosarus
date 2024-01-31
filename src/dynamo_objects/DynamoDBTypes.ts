import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {DynosaurusEncoderError} from "./objectErrors";

export enum DynamoDBTypes {
    STRING = 'S',
    NUMBER = 'N',
    BINARY = 'B',
    BOOLEAN = 'BOOL',
    NULL = 'NULL',
    SET = 'SS',
    NUMBER_SET = 'NS',
    BINARY_SET = 'BS',
}

type IDefaultFunction<T> = () => T;

interface IDynamoDBTypeOptions<T> {
    readOnly?: boolean;
    isPartitionKey?: boolean;
    isSortKey?: boolean;
    canBeUndefined?: boolean;
    defaultValue?: T | IDefaultFunction<T>;
}

const defaultTypeOptions: IDynamoDBTypeOptions<any> = {
    readOnly: false,
    canBeUndefined: false,
    defaultValue: undefined
}

export abstract class DynamoDBType<T> {
    private readonly typeName: string;
    private readonly typeId: DynamoDBTypes;
    private readonly typeOptions?: IDynamoDBTypeOptions<T>;

    protected constructor(typeName: string, typeId: DynamoDBTypes, typeOptions?: IDynamoDBTypeOptions<T>) {
        this.typeName = typeName;
        this.typeId = typeId;

        if (typeOptions) {
            this.typeOptions = typeOptions;
        } else {
            this.typeOptions = defaultTypeOptions;
        }
    }

    public isReadOnly(): boolean {
        return this.typeOptions?.readOnly ?? false;
    }

    public getTypeID(): DynamoDBTypes {
        return this.typeId;
    }

    public isPartitionKey(): boolean {
        return this.typeOptions?.isPartitionKey ?? false;
    }

    public isSortKey(): boolean {
        return this.typeOptions?.isSortKey ?? false;
    }

    public abstract checkType(obj: any): boolean;

    public encode(obj: T): AttributeValue {
        return this._encode(obj);
    }

    public decode(obj: AttributeValue): T {
        return this._decode(obj);
    }

    public abstract _encode(obj: T): AttributeValue;

    public abstract _decode(obj: AttributeValue): T;
}

export class DynamoDBString extends DynamoDBType<string> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<string>) {
        super("string", DynamoDBTypes.STRING, typeOptions);
    }

    public checkType(obj: any): boolean {
        return typeof obj === "string";
    }

    public _encode(obj: string): AttributeValue {
        return {
            S: obj
        }
    }

    public _decode(obj: AttributeValue): string {
        return obj.S;
    }
}

export class DynamoDBNumber extends DynamoDBType<number> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<number>) {
        super("number", DynamoDBTypes.NUMBER, typeOptions);
    }

    public checkType(obj: any): boolean {
        return typeof obj === "number";
    }

    public _encode(obj: number): AttributeValue {
        return {
            N: obj.toString()
        }
    }

    public _decode(obj: AttributeValue): number {
        return Number(obj.N);
    }
}

export class DynamoDBBinary extends DynamoDBType<Buffer> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<Buffer>) {
        super("binary", DynamoDBTypes.BINARY, typeOptions);
    }

    public checkType(obj: any): boolean {
        return Buffer.isBuffer(obj);
    }

    public _encode(obj: Buffer): AttributeValue {
        return {
            B: Buffer.from(obj)
        }
    }

    public _decode(obj: AttributeValue): Buffer {
        return Buffer.from(obj.B);
    }
}

export class DynamoDBBoolean extends DynamoDBType<boolean> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<boolean>) {
        super("boolean", DynamoDBTypes.BOOLEAN, typeOptions);
    }

    public checkType(obj: any): boolean {
        return typeof obj === "boolean";
    }

    public _encode(obj: boolean): AttributeValue {
        return {
            BOOL: obj
        }
    }

    public _decode(obj: AttributeValue): boolean {
        return obj.BOOL;
    }
}

export class DynamoDBNull extends DynamoDBType<null> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<null>) {
        super("null", DynamoDBTypes.NULL, typeOptions);
    }

    public checkType(obj: any): boolean {
        return obj === null;
    }

    public _encode(obj: null): AttributeValue {
        return {
            NULL: true
        }
    }

    public _decode(obj: AttributeValue): null {
        return null;
    }
}

export class DynamoDBStringSet extends DynamoDBType<string[]> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<string[]>) {
        super("set", DynamoDBTypes.SET, typeOptions);
    }

    public checkType(obj: any): boolean {
        return Array.isArray(obj) && obj.every((n) => typeof n === "string");
    }

    public _encode(obj: string[]): AttributeValue {
        return {
            SS: obj
        }
    }

    public _decode(obj: AttributeValue): string[] {
        return obj.SS;
    }
}

export class DynamoDBNumberSet extends DynamoDBType<number[]> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<number[]>) {
        super("numberSet", DynamoDBTypes.NUMBER_SET, typeOptions);
    }

    public checkType(obj: any): boolean {
        return Array.isArray(obj) && obj.every((n) => typeof n === "number");
    }
    public _encode(obj: number[]): AttributeValue {
        return {
            NS: obj.map((n) => n.toString())
        }
    }

    public _decode(obj: AttributeValue): number[] {
        return obj.NS.map((n) => Number(n));
    }
}

export class DynamoDBBinarySet extends DynamoDBType<Buffer[]> {
    public constructor(typeOptions?: IDynamoDBTypeOptions<Buffer[]>) {
        super("binarySet", DynamoDBTypes.BINARY_SET, typeOptions);
    }

    public checkType(obj: any): boolean {
        return Array.isArray(obj) && obj.every((n) => Buffer.isBuffer(n));
    }

    public _encode(obj: Buffer[]): AttributeValue {
        return {
            BS: obj.map((n) => Buffer.from(n))
        }
    }

    public _decode(obj: AttributeValue): Buffer[] {
        return obj.BS.map((n) => Buffer.from(n));
    }
}