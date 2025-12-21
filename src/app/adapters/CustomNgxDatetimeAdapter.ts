import { MomentDateAdapter } from "@angular/material-moment-adapter";
import moment, { Moment } from "moment";

export class CustomDateAdapter extends MomentDateAdapter {

    private static readonly PARSE_FORMAT: string = 'DD/MM/YYYY';
    private static readonly DISPLAY_FORMAT: string = 'DD/MM/YYYY';

    constructor() {
        super('en');
    }

    public override format(date: Moment, _displayFormat: string): string {
        return date.format(CustomDateAdapter.DISPLAY_FORMAT);
    }

    public override parse(value: any, _parseFormat: string | string[]): Moment | null {
        if (!value || value.trim() === '') {
            return null;
        }
        return moment(value, CustomDateAdapter.PARSE_FORMAT, 'en', false);
    }
}