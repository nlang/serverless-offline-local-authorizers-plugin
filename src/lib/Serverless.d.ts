export interface IServerlessFunction {
    name: string;
    memorySize: number;
    timeout: number;
    handler: string;
    events?: IServerlessEvent[];
    package?: IServerlessPackage;
    runtime?: string;
}

export interface IServerlessAuthorizer {
    arn?: string;
    managedExternally?: boolean;
    resultTtlInSeconds?: number;
    identitySource?: string;
    identityValidationExpression?: string;
    type?: string;
    authorizerId?: string;
    scopes?: string[];
}

export interface IServerlessPackage {
    include: string[];
    exclude: string[];
    artifact?: string;
    individually?: boolean;    
}

export interface IServerlessPluginManager {
    spawn(command: string): Promise<void>;
    run(commandsArray): Promise<any>;
}

export declare class Serverless {

    public classes: any;

    public cli: {
        log(message: any, entity?: string, opts?: any): void;
    };

    public config: {
        servicePath: string;
    };

    public service: {
        service: string;
        provider: {
            name: string;
        };
        functions: {
            [key: string]: IServerlessFunction;
        };
        package: IServerlessPackage;
        getAllFunctions(): string[];
    };

    public pluginManager: IServerlessPluginManager;
}

export interface IServerlessOptions {
    stage?: string;
    region?: string;
    function?: string;
    watch?: boolean;
    extraServicePath?: string;
}

export interface IServerlessEvent {
    http?: {
        path: string;
        method: string;
        authorizer?: string | IServerlessAuthorizer;
    };
}
