# API Client models

## Principles for designing a data model

### No view definition

Data models should only contain the data related to the functionality, and not view.
Each application should keep separate metadata related to the view configuration.

### Translatable from a YAML format

We aim to be interoperable with AMF so when designing a data model first design a YAML example with the data and then create a type definition. Additionally, you need to design an AML dialect for the data.

### The "kind" as the object type identifier

Each data object that can exist by itself or in multiple contexts' should contain the `kind` property that uniquely identifies the type. For example, the `HttpProject` class has the `Core#HttpProject`. These kinds are used by other libraries to identify which data types they are given as the input.

### Validation

THe data models should contain validators that produce the validation report. This ensures the support libraries can perform a validation of the data model they are receiving as an input to keep integrity of the data.
