/**
 * File: aws_eventstream_response.ts
 * Author: Gerard Geer
 * 
 * Encapsulates decoding and parsing of AWS EventStream responses, as per:
 * https://docs.aws.amazon.com/lexv2/latest/dg/event-stream-encoding.html
 */ /**
 * Wraps together the parsing of a single AWS EventStream Header.
 */ export class AWSEventStreamHeader {
  view;
  bytes;
  decoder = new TextDecoder();
  offset;
  nameLength = -1;
  name = '';
  valueType = -1;
  valueLength = -1;
  valueString = '';
  length = -1;
  constructor(bytes, offset){
    this.bytes = bytes;
    this.offset = offset;
    this.view = new DataView(this.bytes.buffer, offset);
    this.parseHeaderName();
    this.parseHeaderValue();
    this.length = 1 + this.nameLength + 3 + this.valueLength;
  }
  parseHeaderName() {
    this.nameLength = this.view.getUint8(0);
    let nameStart = this.offset + 1;
    let nameEnd = nameStart + this.nameLength;
    this.name = this.decoder.decode(this.bytes.slice(nameStart, nameEnd));
  }
  parseHeaderValue() {
    let valueTypeOffset = 1 + this.nameLength;
    let valueLengthOffset = valueTypeOffset + 1;
    let valueStringOffset = this.offset + valueLengthOffset + 2;
    this.valueType = this.view.getUint8(valueTypeOffset);
    this.valueLength = this.view.getUint8(valueLengthOffset);
    let valueEnd = valueStringOffset + this.valueLength;
    this.valueString = this.decoder.decode(this.bytes.slice(valueStringOffset, valueEnd));
  }
}
/**
 * Class for parsing and holding the values contained within an AWS Event Stream Response.
 */ export class AWSEventStreamResponse {
  view;
  bytes;
  totalLength = -1;
  headerLength = -1;
  preludeCRC = -1;
  headers = [];
  payload = {};
  messageCRC = -1;
  constructor(bytes){
    this.bytes = bytes;
    this.view = new DataView(this.bytes.buffer);
    this.parsePrelude();
    this.parseHeaders();
    this.parsePayload();
    this.parseMessageCRC();
  }
  parsePrelude() {
    let totalLengthOffset = 0;
    let headerLengthOffset = 4;
    let preludeCRCOffset = 8;
    this.totalLength = this.view.getUint32(totalLengthOffset);
    this.headerLength = this.view.getUint32(headerLengthOffset);
    this.preludeCRC = this.view.getUint32(preludeCRCOffset);
  }
  parseHeaders() {
    let currentHeaderOffset = 12;
    let headerBytesRead = 0;
    while(headerBytesRead < this.headerLength){
      let curHeader = new AWSEventStreamHeader(this.bytes, currentHeaderOffset);
      let curHeaderSize = curHeader.length;
      currentHeaderOffset += curHeaderSize;
      headerBytesRead += curHeaderSize;
      this.headers.push(curHeader);
    }
  }
  parsePayload() {
    let payloadStart = 12 + this.headerLength;
    let payloadEnd = this.totalLength - 4;
    let payloadSlice = this.bytes.slice(payloadStart, payloadEnd);
    let decoder = new TextDecoder();
    let jstr = decoder.decode(payloadSlice);
    this.payload = JSON.parse(jstr);
  }
  parseMessageCRC() {
    let messageCRCOffset = this.totalLength - 4;
    this.messageCRC = this.view.getUint32(messageCRCOffset);
  }
  getAssistantResponse() {
    let miiJSON = JSON.parse(this.payload['trace']['orchestrationTrace']['modelInvocationInput']['text']);
    let messages = miiJSON['messages'];
    let assistantResponse = '';
    for(let i = 0; i < messages.length; ++i){
      if (messages[i]['role'] == 'assistant') {
        assistantResponse += messages[i]['content'];
      }
    }
    let answers = Array.from(assistantResponse.matchAll(/<answer>(((?!<answer>).)*)<\/answer>/g));
    return answers[answers.length - 1];
  }
}
export class AWSEventIdentifier {
  id = '1234';
}
