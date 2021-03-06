const amlKey = 'http://a.ml/';
const vocKey = `${amlKey}vocabularies/`;
const docKey = `${vocKey}document#`;
const coreKey = `${vocKey}core#`;
const secKey = `${vocKey}security#`;
const contractKey = `${vocKey}apiContract#`;
const shapesKey = `${vocKey}shapes#`;
const dataKey = `${vocKey}data#`;
const dsmKey = `${vocKey}document-source-maps#`;
const w3Key = 'http://www.w3.org/';
const shaclKey = `${w3Key}ns/shacl#`;
const xmlSchemaKey = `${w3Key}2001/XMLSchema#`;
const rdfSyntaxKey = `${w3Key}1999/02/22-rdf-syntax-ns#`;
const rdfSchemaKey = `${w3Key}2000/01/rdf-schema#`;

/**
 * AMF namespace.
 */
export const AmfNamespace = {
  aml: {
    key: 'http://a.ml/',
    vocabularies: {
      key: vocKey,
      document: {
        key: docKey,
        Module: `${docKey}Module`,
        Document: `${docKey}Document`,
        SecuritySchemeFragment: `${docKey}SecuritySchemeFragment`,
        UserDocumentation: `${docKey}UserDocumentation`,
        DataType: `${docKey}DataType`,
        NamedExamples: `${docKey}NamedExamples`,
        DomainElement: `${docKey}DomainElement`,
        ParametrizedDeclaration: `${docKey}ParametrizedDeclaration`,
        ExternalDomainElement: `${docKey}ExternalDomainElement`,

        customDomainProperties: `${docKey}customDomainProperties`,
        encodes: `${docKey}encodes`,
        declares: `${docKey}declares`,
        references: `${docKey}references`,
        examples: `${docKey}examples`,
        linkTarget: `${docKey}link-target`,
        linkLabel: `${docKey}link-label`,
        referenceId: `${docKey}reference-id`,
        structuredValue: `${docKey}structuredValue`,
        raw: `${docKey}raw`,
        extends: `${docKey}extends`,
        value: `${docKey}value`,
        name: `${docKey}name`,
        strict: `${docKey}strict`,
        deprecated: `${docKey}deprecated`,
        location: `${docKey}location`,
        variable: `${docKey}variable`,
        target: `${docKey}target`,
        dataNode: `${docKey}dataNode`,
        root: `${docKey}root`,
        usage: `${docKey}usage`,
        version: `${docKey}version`,
      },
      core: {
        key: coreKey,
        CreativeWork: `${coreKey}CreativeWork`,

        version: `${coreKey}version`,
        urlTemplate: `${coreKey}urlTemplate`,
        displayName: `${coreKey}displayName`,
        title: `${coreKey}title`,
        name: `${coreKey}name`,
        description: `${coreKey}description`,
        documentation: `${coreKey}documentation`,
        summary: `${coreKey}summary`,
        provider: `${coreKey}provider`,
        email: `${coreKey}email`,
        url: `${coreKey}url`,
        termsOfService: `${coreKey}termsOfService`,
        license: `${coreKey}license`,
        mediaType: `${coreKey}mediaType`,
        extensionName: `${coreKey}extensionName`,
        deprecated: `${coreKey}deprecated`,
      },
      security: {
        key: secKey,
        ParametrizedSecurityScheme: `${secKey}ParametrizedSecurityScheme`,
        SecuritySchemeFragment: `${secKey}SecuritySchemeFragment`,
        SecurityScheme: `${secKey}SecurityScheme`,
        OAuth1Settings: `${secKey}OAuth1Settings`,
        OAuth2Settings: `${secKey}OAuth2Settings`,
        OAuth2Flow: `${secKey}OAuth2Flow`,
        Scope: `${secKey}Scope`,
        Settings: `${secKey}Settings`,
        HttpSettings: `${secKey}HttpSettings`,
        ApiKeySettings: `${secKey}ApiKeySettings`,
        OpenIdConnectSettings: `${secKey}OpenIdConnectSettings`,
        security: `${secKey}security`,
        scheme: `${secKey}scheme`,
        schemes: `${secKey}schemes`,
        settings: `${secKey}settings`,
        name: `${secKey}name`,
        type: `${secKey}type`,
        scope: `${secKey}scope`,
        accessTokenUri: `${secKey}accessTokenUri`,
        authorizationUri: `${secKey}authorizationUri`,
        authorizationGrant: `${secKey}authorizationGrant`,
        flows: `${secKey}flows`,
        flow: `${secKey}flow`,
        signature: `${secKey}signature`,
        tokenCredentialsUri: `${secKey}tokenCredentialsUri`,
        requestTokenUri: `${secKey}requestTokenUri`,
        refreshUri: `${secKey}refreshUri`,
        securityRequirement: `${secKey}SecurityRequirement`,
        openIdConnectUrl: `${secKey}openIdConnectUrl`,
        bearerFormat: `${secKey}bearerFormat`,
        in: `${secKey}in`,
      },
      apiContract: {
        key: contractKey,
        Payload: `${contractKey}Payload`,
        Request: `${contractKey}Request`,
        Response: `${contractKey}Response`,
        EndPoint: `${contractKey}EndPoint`,
        Parameter: `${contractKey}Parameter`,
        Operation: `${contractKey}Operation`,
        WebAPI: `${contractKey}WebAPI`,
        API: `${contractKey}API`,
        AsyncAPI: `${contractKey}AsyncAPI`,
        UserDocumentationFragment: `${contractKey}UserDocumentationFragment`,
        Example: `${contractKey}Example`,
        Server: `${contractKey}Server`,
        ParametrizedResourceType: `${contractKey}ParametrizedResourceType`,
        ParametrizedTrait: `${contractKey}ParametrizedTrait`,
        Callback: `${contractKey}Callback`,
        TemplatedLink: `${contractKey}TemplatedLink`,
        IriTemplateMapping: `${contractKey}IriTemplateMapping`,
        Tag: `${contractKey}Tag`,
        Message: `${contractKey}Message`,

        header: `${contractKey}header`,
        parameter: `${contractKey}parameter`,
        paramName: `${contractKey}paramName`,
        uriParameter: `${contractKey}uriParameter`,
        cookieParameter: `${contractKey}cookieParameter`,
        variable: `${contractKey}variable`,
        payload: `${contractKey}payload`,
        server: `${contractKey}server`,
        path: `${contractKey}path`,
        url: `${contractKey}url`,
        scheme: `${contractKey}scheme`,
        endpoint: `${contractKey}endpoint`,
        queryString: `${contractKey}queryString`,
        accepts: `${contractKey}accepts`,
        guiSummary: `${contractKey}guiSummary`,
        binding: `${contractKey}binding`,
        response: `${contractKey}response`,
        returns: `${contractKey}returns`,
        expects: `${contractKey}expects`,
        examples: `${contractKey}examples`,
        supportedOperation: `${contractKey}supportedOperation`,
        statusCode: `${contractKey}statusCode`,
        method: `${contractKey}method`,
        required: `${contractKey}required`,
        callback: `${contractKey}callback`,
        expression: `${contractKey}expression`,
        link: `${contractKey}link`,
        linkExpression: `${contractKey}linkExpression`,
        templateVariable: `${contractKey}templateVariable`,
        mapping: `${contractKey}mapping`,
        operationId: `${contractKey}operationId`,
        protocol: `${contractKey}protocol`,
        protocolVersion: `${contractKey}protocolVersion`,
        headerSchema: `${contractKey}headerSchema`,
        contentType: `${contractKey}contentType`,
        allowEmptyValue: `${contractKey}allowEmptyValue`,
        style: `${contractKey}style`,
        explode: `${contractKey}explode`,
        allowReserved: `${contractKey}allowReserved`,
        tag: `${contractKey}tag`,
      },
      shapes: {
        key: shapesKey,
        Shape: `${shapesKey}Shape`,
        ScalarShape: `${shapesKey}ScalarShape`,
        ArrayShape: `${shapesKey}ArrayShape`,
        UnionShape: `${shapesKey}UnionShape`,
        NilShape: `${shapesKey}NilShape`,
        FileShape: `${shapesKey}FileShape`,
        AnyShape: `${shapesKey}AnyShape`,
        SchemaShape: `${shapesKey}SchemaShape`,
        MatrixShape: `${shapesKey}MatrixShape`,
        TupleShape: `${shapesKey}TupleShape`,
        RecursiveShape: `${shapesKey}RecursiveShape`,
        DataTypeFragment: `${shapesKey}DataTypeFragment`,
        XMLSerializer: `${shapesKey}XMLSerializer`,
  
        // data types
        number: `${shapesKey}number`,
        integer: `${shapesKey}integer`,
        long: `${shapesKey}long`,
        double: `${shapesKey}double`,
        boolean: `${shapesKey}boolean`,
        float: `${shapesKey}float`,
        nil: `${shapesKey}nil`,
        password: `${shapesKey}password`,
        
        // extra data types for Protocol buffers
        int32: `${shapesKey}int32`,
        int64: `${shapesKey}int64`,
        uint32: `${shapesKey}uint32`,
        uint64: `${shapesKey}uint64`,
        sint32: `${shapesKey}sint32`,
        sint64: `${shapesKey}sint64`,
        fixed32: `${shapesKey}fixed32`,
        fixed64: `${shapesKey}fixed64`,
        sfixed32: `${shapesKey}sfixed32`,
        sfixed64: `${shapesKey}sfixed64`,

        // API shapes
        dateTimeOnly: `${shapesKey}dateTimeOnly`,

        range: `${shapesKey}range`,
        items: `${shapesKey}items`,
        anyOf: `${shapesKey}anyOf`,
        fileType: `${shapesKey}fileType`,
        schema: `${shapesKey}schema`,
        xmlSerialization: `${shapesKey}xmlSerialization`,
        xmlName: `${shapesKey}xmlName`,
        xmlAttribute: `${shapesKey}xmlAttribute`,
        xmlWrapped: `${shapesKey}xmlWrapped`,
        xmlNamespace: `${shapesKey}xmlNamespace`,
        xmlPrefix: `${shapesKey}xmlPrefix`,
        readOnly: `${shapesKey}readOnly`,
        writeOnly: `${shapesKey}writeOnly`,
        deprecated: `${shapesKey}deprecated`,
        fixPoint: `${shapesKey}fixPoint`,
        discriminator: `${shapesKey}discriminator`,
        discriminatorValue: `${shapesKey}discriminatorValue`,
        format: `${shapesKey}format`,
        multipleOf: `${shapesKey}multipleOf`,
        uniqueItems: `${shapesKey}uniqueItems`,
      },
      data: {
        key: dataKey,
        Scalar: `${dataKey}Scalar`,
        Object: `${dataKey}Object`,
        Array: `${dataKey}Array`,
        Node: `${dataKey}Node`,

        value: `${dataKey}value`,
        type: `${dataKey}type`,
        description: `${dataKey}description`,
        required: `${dataKey}required`,
        displayName: `${dataKey}displayName`,
        minLength: `${dataKey}minLength`,
        maxLength: `${dataKey}maxLength`,
        default: `${dataKey}default`,
        multipleOf: `${dataKey}multipleOf`,
        minimum: `${dataKey}minimum`,
        maximum: `${dataKey}maximum`,
        enum: `${dataKey}enum`,
        pattern: `${dataKey}pattern`,
        items: `${dataKey}items`,
        format: `${dataKey}format`,
        example: `${dataKey}example`,
        examples: `${dataKey}examples`,
      },
      docSourceMaps: {
        key: dsmKey,
        SourceMap: `${dsmKey}SourceMap`,
        sources: `${dsmKey}sources`,
        element: `${dsmKey}element`,
        value: `${dsmKey}value`,
        declaredElement: `${dsmKey}declared-element`,
        trackedElement: `${dsmKey}tracked-element`,
        parsedJsonSchema: `${dsmKey}parsed-json-schema`,
        autoGeneratedName: `${dsmKey}auto-generated-name`,
        lexical: `${dsmKey}lexical`,
        synthesizedField: `${dsmKey}synthesized-field`,
      },
    },
  },
  w3: {
    key: w3Key,
    shacl: {
      key: shaclKey,
      Shape: `${shaclKey}Shape`,
      NodeShape: `${shaclKey}NodeShape`,
      SchemaShape: `${shaclKey}SchemaShape`,
      PropertyShape: `${shaclKey}PropertyShape`,
      in: `${shaclKey}in`,
      defaultValue: `${shaclKey}defaultValue`,
      defaultValueStr: `${shaclKey}defaultValueStr`,
      pattern: `${shaclKey}pattern`,
      minInclusive: `${shaclKey}minInclusive`,
      maxInclusive: `${shaclKey}maxInclusive`,
      multipleOf: `${shaclKey}multipleOf`,
      minLength: `${shaclKey}minLength`,
      maxLength: `${shaclKey}maxLength`,
      fileType: `${shaclKey}fileType`,
      and: `${shaclKey}and`,
      property: `${shaclKey}property`,
      name: `${shaclKey}name`,
      raw: `${shaclKey}raw`,
      datatype: `${shaclKey}datatype`,
      minCount: `${shaclKey}minCount`,
      maxCount: `${shaclKey}maxCount`,
      xone: `${shaclKey}xone`,
      not: `${shaclKey}not`,
      or: `${shaclKey}or`,
      closed: `${shaclKey}closed`,
      path: `${shaclKey}path`,
    },
    // XML schema data types
    xmlSchema: {
      key: xmlSchemaKey,
      boolean: `${xmlSchemaKey}boolean`,
      string: `${xmlSchemaKey}string`,
      number: `${xmlSchemaKey}number`,
      integer: `${xmlSchemaKey}integer`,
      long: `${xmlSchemaKey}long`,
      double: `${xmlSchemaKey}double`,
      float: `${xmlSchemaKey}float`,
      nil: `${xmlSchemaKey}nil`,
      dateTime: `${xmlSchemaKey}dateTime`,
      time: `${xmlSchemaKey}time`,
      date: `${xmlSchemaKey}date`,
      base64Binary: `${xmlSchemaKey}base64Binary`,
      byte: `${xmlSchemaKey}byte`,
    },
    rdfSyntax: {
      key: rdfSyntaxKey,

      Seq: `${rdfSyntaxKey}Seq`,
      member: `${rdfSyntaxKey}member`,
    },

    rdfSchema: {
      key: rdfSchemaKey,

      Seq: `${rdfSchemaKey}Seq`,
      member: `${rdfSchemaKey}member`,
    }
  },
};
