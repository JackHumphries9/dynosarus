import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {DynosaurusEncoderError as DecoderError, DynosaurusDecoderError as EncoderError} from "./objectErrors";
import {DynamoDBNull, DynamoDBType} from "./DynamoDBTypes";

export class DynosaurusObject<T> {

    constructor(public readonly schema: DynosaurusObject<T>) {

    }

    public getSchema(): DynosaurusObject<T> {
        return this.schema;
    }


}