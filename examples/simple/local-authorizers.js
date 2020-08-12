const testAuthFnAllow = async (event, context) => {
  return {
    principalId: "foo",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [{
        Action: "execute-api:invoke",
        Effect: "Allow",
        Resource: "*"
      }]
    }
  };
};

const testAuthFnDeny = async (event, context) => {
  return {
    principalId: "foo",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [{
        Action: "execute-api:invoke",
        Effect: "Deny",
        Resource: "*"
      }]
    }
  };
};
module.exports = { testAuthFnAllow, testAuthFnDeny };
