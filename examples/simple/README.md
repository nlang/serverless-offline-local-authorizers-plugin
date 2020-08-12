# Simple Example

Run: 

`$ sls offline local-authorizers`

Test:

`GET http://localhost:3000/allow` => `HELLO WORLD`

`GET http://localhost:3000/deny` => 
```
{
 statusCode: 403,
 error: "Forbidden",
 message: "User is not authorized to access this resource"
}
```
