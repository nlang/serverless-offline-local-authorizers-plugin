import {IServerlessOptions, Serverless} from "./Serverless";

interface Handler {
    name: string,
    filePath?: string
}
export class AwsLocalAuthorizerPlugin {

    public hooks: { [key: string]: () => void };
    public commands: { [key: string]: any };
    private handlers: Handler[] = [];

    constructor(private serverless: Serverless, private options: IServerlessOptions) {

        if (this.serverless.service.provider.name !== "aws") {
            throw new this.serverless.classes.Error("aws-local-authorizers plugin only supports AWS as provider.");
        }

        this.commands = {
            offline: {
                commands: {
                    "local-authorizers": {
                        usage: "Replaces authorizers with local functions for offline testing",
                        lifecycleEvents: [
                            "applyLocalAuthorizers",
                            "start",
                        ],
                    },
                },
            },
        };

        this.serverless.configSchemaHandler.defineFunctionEventProperties('aws', 'http', {
            properties: {
                localAuthorizer: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        type: {
                            anyOf: ['token', 'cognito_user_pools', 'request', 'aws_iam'].map(
                              v => ({ type: 'string', regexp: new RegExp(`^${v}$`, 'i').toString() })
                            ),
                        },
                        filePath: { type: "string" },
                    }
                },
            },
        });

        this.hooks = {
            "offline:local-authorizers:applyLocalAuthorizers": () => this.applyLocalAuthorizers(),
            "after:offline:local-authorizers:start": () => this.serverless.pluginManager.run(["offline", "start"]),
        };
    }

    private async applyLocalAuthorizers(): Promise<any> {
        const functions = this.serverless.service.functions;
        for (const functionName of Object.keys(functions)) {

            const functionDef = functions[functionName];
            if (functionDef && Array.isArray(functionDef.events)) {

                for (const event of functionDef.events) {
                    if (!event.http) {
                        continue;
                    }

                    const http = event.http as any;
                    let localAuthorizerDef = (http.authorizer && http.authorizer.localAuthorizer) ?  http.authorizer.localAuthorizer : http.localAuthorizer;

                    if (typeof localAuthorizerDef === "string") {
                        localAuthorizerDef = { name: localAuthorizerDef };
                    }

                    if (localAuthorizerDef) {
                            const mockFnName = localAuthorizerDef.name;
                            console.log('mock', `$__LOCAL_AUTHORIZER_${mockFnName}`)
                            http.authorizer = {
                                name: `$__LOCAL_AUTHORIZER_${mockFnName}`,
                                type: localAuthorizerDef.type || "token",
                            };
                            this.registerHandler(localAuthorizerDef);
                    }
                }
            }
        }

        
        this.appendLocalAuthorizers();
    }

    private registerHandler(handler: Handler) {
        if (!handler.filePath) {
            handler.filePath = 'local-authorizers.js'
        }

        const exists = this.handlers.find(item => item.name === handler.name);
        if (!exists) {
            this.handlers.push(handler);
        }
    }

    private appendLocalAuthorizers() {
        this.handlers.forEach(handler => {
            const { name, filePath } = handler;
            const functionKey = `$__LOCAL_AUTHORIZER_${name}`;
            this.serverless.service.functions[functionKey] = {
                memorySize: 256,
                timeout: 30,
                handler: `${filePath.split('.')[0]}.${name}`,
                events: [],
                name: `${this.serverless.service.service}-${this.options.stage}-authorizer${name}`,
                package:{
                    include:[filePath],
                    exclude:[]
                },
            };
        })
    }
}
