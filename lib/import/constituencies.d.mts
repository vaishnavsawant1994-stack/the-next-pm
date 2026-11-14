
export type ConstituencyRow={regionSlug:string;number:number;name:string;boundaryVersion:string};
export function parseCsv(csv:string):string[][];
export function validateConstituencyCsv(csv:string,stateCounts:Record<string,number>):{regionSlug:string;rows:ConstituencyRow[]};
