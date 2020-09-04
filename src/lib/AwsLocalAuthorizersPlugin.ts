import {IServerlessOptions, Serverless} from "./Serverless";

export class AwsLocalAuthorizerPlugin {

    public hooks: { [key: string]: () => void };
    public commands: { [key: string]: any };

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

        this.hooks = {
            "offline:local-authorizers:applyLocalAuthorizers": () => this.applyLocalAuthorizers(),
            "after:offline:local-authorizers:start": () => this.serverless.pluginManager.run(["offline", "start"]),
        };
    }

    private async applyLocalAuthorizers(): Promise<any> {

        const localAuthorizers = this.appendLocalAuthorizers();
        if (!localAuthorizers || !Object.keys(localAuthorizers).length) {
            this.serverless.cli.log(`No local authorizers found.`, "serverless-offline-local-authorizers-plugin", { color: "yellow" });
            return;
        }

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
                        if (localAuthorizers[localAuthorizerDef.name]) {
                            const mockFnName = localAuthorizers[localAuthorizerDef.name];
                            http.authorizer = {
                                name: mockFnName,
                                type: localAuthorizerDef.type || "token",
                            };
                        } else {
                            this.serverless.cli.log(`Invalid or unknown local authorizer '${JSON.stringify(localAuthorizerDef)}'`,
                                "serverless-offline-local-authorizers-plugin",
                                { color: "yellow" });
                        }
                    }
                }
            }
        }
    }

    private appendLocalAuthorizers(): { [authorizerName: string]: string } {

        const authorizersFile = `${this.serverless.config.servicePath}/local-authorizers.js`;
        let authorizers = {};

        try {
            authorizers = require(authorizersFile);
        } catch (err) {
            this.serverless.cli.log(`Unable to load local authorizers from ${authorizersFile}`, "serverless-offline-local-authorizers-plugin", { color: "red" });
            return null;
        }

        return Object.keys(authorizers).reduce((prev, authorizerName) => {
            const functionKey = `$__LOCAL_AUTHORIZER_${authorizerName}`;
            this.serverless.service.functions[functionKey] = {
                memorySize: 256,
                timeout: 30,
                handler: "local-authorizers." + authorizerName,
                events: [],
                name: `${this.serverless.service.service}-${this.options.stage}-${authorizerName}`,
            };
            prev[authorizerName] = functionKey;
            return prev;
        }, {});
    }
}
