export class EncoderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EncoderError";
    }
}

export class DecoderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DecoderError";
    }
}