import {DynamoDBObject} from "../src";
import {DynosaurusSchema} from "../src/dynamo_objects/DynamoDBSchema";
import {
    DynamoDBBinary, DynamoDBBinarySet,
    DynamoDBBoolean,
    DynamoDBNull,
    DynamoDBNumber, DynamoDBNumberSet,
    DynamoDBString, DynamoDBStringSet
} from "../src";
import {AttributeValue} from "@aws-sdk/client-dynamodb";

const testSchema = new DynosaurusSchema({
    "num": new DynamoDBNumber(),
    "str": new DynamoDBString(),
    "bool": new DynamoDBBoolean(),
    "null": new DynamoDBNull(),
    "set": new DynamoDBStringSet(),
    "numberSet": new DynamoDBNumberSet(),
    "binarySet": new DynamoDBBinarySet(),
    "binary": new DynamoDBBinary(),

    "simpleArray": [new DynamoDBString()],
    "complexArray": [
        {
            "test": new DynamoDBString(),
            "test2": new DynamoDBNumber()
        },
    ],

    "objectTest": {
        "test": new DynamoDBString(),
        "test2": new DynamoDBNumber()
    },

    "wildcard": {
        "*": {
            "test": new DynamoDBString(),
            "test2": new DynamoDBNumber()
        }
    }
})

const testObject = {
    num: 1,
    str: "test",
    bool: true,
    null: null,
    set: ["test", "test2"],
    numberSet: [1, 2],
    binarySet: [Buffer.from("test1"), Buffer.from("test2")],
    binary: Buffer.from("test"),

    simpleArray: ["test", "test2"],
    complexArray: [{test: "test", test2: 1}, {test: "test2", test2: 2}],
    objectTest: {test: "test", test2: 1},

    wildcard: {
        "test": {
            test: "test",
            test2: 1
        },
        "test2": {
            test: "test2",
            test2: 2
        }
    }
}

const encodedTest: Record<string, AttributeValue> = {
    num: {
        N: "1"
    },
    str: {
        S: "test"
    },
    bool: {
        BOOL: true
    },
    null: {
        NULL: true
    },
    set: {
        SS: ["test", "test2"]
    },
    numberSet: {
        NS: ["1", "2"]
    },
    binarySet: {
        BS: ["test1", "test2"].map((n) => Buffer.from(n))
    },
    binary: {
        B: Buffer.from("test")
    },

    simpleArray: {
        L: [{S: "test"}, {S: "test2"}]
    },
    complexArray: {
        L: [{M: {
                test: { "S": "test"},
                test2: {N: "1"}
            }},
            {M: {
                test: { "S": "test2"},
                test2: {N: "2"}
                }
            }]
    },
    objectTest: {
        M: {test: {S: "test"}, test2: {N: "1"}}

    },

    wildcard: {
        M: {
            "test": {
                M: {
                    "test":  {
                        "S": "test",
                    },
                   "test2":  {
                        "N": "1",
                   },
                }
            },
            "test2": {
                M: {
                    "test":  {
                        "S": "test2",
                    },
                    "test2":  {
                        "N": "2",
                    },
                }
            }
        }
    }
}

describe("Object stuff", () => {
   test("Encode example object", () => {
       const encoded = testSchema.encode(testObject)

       expect(encoded).toEqual(encodedTest)
   })

    test("Decode example object", () => {
        const decoded = testSchema.decode(encodedTest as any);

        expect(decoded).toEqual(testObject);
    })

})
