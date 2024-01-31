export class DynosaurusEncoderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EncoderError";
    }
}

export class DynosaurusDecoderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DecoderError";
    }
}

export class DynosaurusTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DynosaurusTypeError";
    }
}