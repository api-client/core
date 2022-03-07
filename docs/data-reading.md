# Reading a request data

This module exports the `RequestDataExtractor` class that is responsible to extract data from the request/response.

This is available in: **browser** and **node**.

The `RequestDataExtractor` takes request and response definitions and additional data extraction configuration and reads the data from the corresponding source. Under the hood it uses a more specialized classes: `JsonReader`, `XmlReader`, and `UrlEncodedReader`. Depending on the request / response `content-type` header it chooses the appropriate implementation.

## Configuring the data search path in the body

The body search uses the [XPath](https://www.w3schools.com/xml/xpath_syntax.asp) notation to search in the response data. Internally responses are translated into an XML document and it runs the XML's XPath implementation to search for the value.

### XML

Examples of configuring the path for the XML reader:

#### Simple example

```xml
<xml>
  <a>b</a>
  <c>d</c>
</xml>
```

The path:

```xpath
/xml/a/text()
```

reads the value `b`.

#### Deep paths

```xml
<xml>
  <a>
    <b>c</b>
  </a>
</xml>
```

The path:

```xpath
/xml/a/b
```

reads the value `c`.

#### Searching for an XML value

```xml
<xml>
  <city>
    <name>Seattle</name>
    <state>WA</state>
  </city>
  <city>
    <name>New York</name>
    <state>NY</state>
  </city>
  <city>
    <name>Bellevue</name>
    <state>WA</state>
  </city>
  <city>
    <name>Olympia</name>
    <state>WA</state>
  </city>
</xml>
```

The path:

```xpath
/xml/city[state=\'WA\'][2]/name
```

reads the value `Bellevue`.

### JSON

Examples of configuring the path for the JSON reader:

#### Simple JSON

```json
{ "a": "b", "c": "d" }
```

The path:

```xpath
/a
```

reads the value `b`.

#### Deep JSON path

```json
{"a": { "b" : "c" }}
```

The path:

```xpath
/a/b
```

reads the value `c`.

#### Search in JSON path

```json
[
  {"name": "Seattle", "state": "WA"},
  {"name": "New York", "state": "NY"},
  {"name": "Bellevue", "state": "WA"},
  {"name": "Olympia", "state": "WA"}
]
```

The path:

```xpath
/city[state='WA'][2]/name
```

reads the value `Bellevue`.

### application/x-www-form-urlencoded

This accepts only a simple form of the path.

```application/x-www-form-urlencoded
access_token=abc123&expires_at=1234567
```

The path:

```xpath
access_token
```

reads the value `abc123`.

## Configuring the reader

To extract data with the `RequestDataExtractor` class you need to pass the config object to the `extract()` function.

The config object corresponds to the `IDataSource` definition.

### Body reading configuration

```ts
import { ActionEnums, IDataSource } from '@api-client/core';

const config: IDataSource = {
  type: ActionEnums.ActionTypeEnum.response,
  source: ActionEnums.ResponseDataSourceEnum.body,
  path: '/city[state=\'WA\'][2]/name',
}
```

Which translates to: take the `response` object, then in the `body` search for a value given the query `/city[state=\'WA\'][2]/name`.

## Headers reading configuration

```ts
import { ActionEnums, IDataSource } from '@api-client/core';

const config: IDataSource = {
  type: ActionEnums.ActionTypeEnum.response,
  source: ActionEnums.ResponseDataSourceEnum.headers,
  path: 'content-type',
}
```

Note, this always returns a string even when multiple headers were set in the response. This is valid according to the HTTP spec.

## URL reading configuration

```ts
import { ActionEnums, IDataSource } from '@api-client/core';

const config: IDataSource = {
  type: ActionEnums.ActionTypeEnum.response,
  source: ActionEnums.ResponseDataSourceEnum.url,
  path: 'host', // or 'protocol', 'path', 'query', 'query.NAME', 'hash', 'hash.NAME'
}
```

## HTTP status reading configuration

```ts
import { ActionEnums, IDataSource } from '@api-client/core';

const config: IDataSource = {
  type: ActionEnums.ActionTypeEnum.response,
  source: ActionEnums.ResponseDataSourceEnum.status,
}
```

Returned value is a **string**. It is only available for the response type.

## HTTP method reading configuration

```ts
import { ActionEnums, IDataSource } from '@api-client/core';

const config: IDataSource = {
  type: ActionEnums.ActionTypeEnum.request,
  source: ActionEnums.ResponseDataSourceEnum.method,
}
```

It is only available for the request type.
