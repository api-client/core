# API Client/ARC models

## Principles for designing a data model

### No view definition

Data models should only contain the data related to the functionality, and not view.
Each application should keep separate metadata related to the view configuration.

### Translatable from a YAML format

We aim to be interoperable with AMF so when designing a data model first design a YAML example with the data and then create a type definition. Additionally, you need to design an AML dialect for the data.
