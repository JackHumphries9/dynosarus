import {DynosaurusSchema} from "../dynamo_objects/DynamoDBSchema";
import {
    AttributeDefinition,
    AttributeValue,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import {DynosaurusClient} from "../dynamo_client/dynamoClient";

interface IDynosaurusKey {
    partitionKey: string;
    sortKey?: string;
}

export class DynosaurusTable<T> {
    constructor(private readonly client: DynosaurusClient, private readonly tableName: string, private readonly schema: DynosaurusSchema<T>) {
        this.tableName = tableName;
        this.schema = schema;
    }
    getTableName() {
        return this.tableName;
    }
    getSchema() {
        return this.schema;
    }

    async create(item: T) {
        const command = new PutItemCommand({
            TableName: this.tableName,
            Item: this.schema.encode(item),
        })

        await this.client.getClient().send(command);
    }

    async getOne(key: IDynosaurusKey): Promise<T> {
        const keys = this.buildKey(key);

        const command = new GetItemCommand({
            TableName: this.tableName,
            Key: keys as any,
        });

        const result = await this.client.getClient().send(command);

        if (result.Item) {
            return this.schema.decode(result.Item);
        } else {
            throw new Error("Item not found");
        }
    }



    private buildKey(key: IDynosaurusKey) {
        const partitionKeySchema = this.schema.getPartitionKey();
        const sortKeySchema = this.schema.getSortKey();

        const keys = {
            [partitionKeySchema]: { [this.schema.getKeyDynamoDBTypes(partitionKeySchema) as any]: key.partitionKey },
            ...(key.sortKey ? { [sortKeySchema]: { [this.schema.getKeyDynamoDBTypes(key.sortKey) as any]: key.sortKey }} : {}),
        }

        return keys;

    }

    async update(key: IDynosaurusKey, obj: Partial<T>) {
        const keys = this.buildKey(key);

        const command = new UpdateItemCommand({
            TableName: this.tableName,
            Key: keys as any,
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {},
            UpdateExpression: "SET",
        })

        const encodedObj = this.schema.encode(obj as T);

        for (const k in encodedObj) {
            if (encodedObj[k] === undefined) {
                continue;
            }

            if (k == this.schema.getPartitionKey() || k == this.schema.getSortKey()) {
                throw new Error("Cannot update partition or sort key");
            }

            command.input.ExpressionAttributeNames[`#${k}`] = k;
            command.input.ExpressionAttributeValues[`:${k}`] = encodedObj[k];
            command.input.UpdateExpression += ` #${k} = :${k},`;
        }

        // Remove trailing comma
        command.input.UpdateExpression = command.input.UpdateExpression.slice(0, -1);

        if (Object.keys(command.input.ExpressionAttributeNames).length === 0 ||
            Object.keys(command.input.ExpressionAttributeValues).length === 0 ||
            command.input.UpdateExpression === "SET") {
            throw new Error("No fields to update");
        }

        await this.client.getClient().send(command);
    }

    async delete(key: IDynosaurusKey) {
        const keys = this.buildKey(key);

        const command = new UpdateItemCommand({
            TableName: this.tableName,
            Key: keys as any,
        })

        await this.client.getClient().send(command);
    }
}