import { makeAutoObservable } from "mobx";

export type UploadRecord = {
    name: string;
    path: string;
    webUrl: string;
    rawUrl: string;
    sha?: string;
    size: number;
    time: number;
};

export class UploadState {
    public records: UploadRecord[] = [];
    constructor() {
        makeAutoObservable(this);
    }
    add(record: UploadRecord) {
        this.records.unshift(record);
    }
    clear() {
        this.records = [];
    }
}

export const uploadState = new UploadState();

