export interface EnumSchemaInterface {
    type?: any;
    enum?: any;
    get?: any;
    set?: any;
    default?: any;
    required: boolean;
  }
  
export class EnumSchemaType {
static forEnum(type: any, required: boolean = true, def?: any): EnumSchemaInterface {
    return {
    required,
    type: String,
    enum: Object.values(type),
    get: (value: string) => value as unknown as typeof type,
    set: (value: typeof type) => value.toString(),
    default: def
    };
}
}
  