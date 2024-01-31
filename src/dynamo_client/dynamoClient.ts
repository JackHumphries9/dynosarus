import {DynamoDBClient, DynamoDBClientConfig} from "@aws-sdk/client-dynamodb";

export class DynosaurusClient {
    private readonly dynamoClient: DynamoDBClient;
    constructor(config?: DynamoDBClientConfig, client?: DynamoDBClient) {
        if (client) {
            this.dynamoClient = client;
            return;
        }
        this.dynamoClient = new DynamoDBClient(config);
    }

    public getClient(): DynamoDBClient {
        return this.dynamoClient;
    }

    public static fromClient(client: DynamoDBClient): DynosaurusClient {
        return new DynosaurusClient(undefined, client);
    }
}