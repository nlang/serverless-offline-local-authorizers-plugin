# Simple Example

Run: 

`$ sls offline local-authorizers`

Test:

`GET http://localhost:3000/dev/allow` => `HELLO WORLD`

`GET http://localhost:3000/dev/deny` => 
```
{
 statusCode: 403,
 error: "Forbidden",
 message: "User is not authorized to access this resource"
}
```
