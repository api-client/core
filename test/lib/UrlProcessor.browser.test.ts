import { assert } from '@esm-bundle/chai';
import { UrlProcessor, IUrlParamPart } from '../../src/lib/parsers/UrlProcessor.js';

const levels = {
  // http://tools.ietf.org/html/rfc6570#section-1.2
  'Level 1': {
    expressions: {
      'Simple string expansion': {
        '{var}': 'value',
        '{hello}': 'Hello%20World%21'
      }
    },
    values: {
      'var': 'value',
      'hello': 'Hello World!'
    }
  },
  'Level 2': {
    expressions: {
      'Reserved string expansion': {
        '{+var}': 'value',
        '{+hello}': 'Hello%20World!',
        '{+path}/here': '/foo/bar/here',
        'here?ref={+path}': 'here?ref=/foo/bar'
      },
      'Fragment expansion, crosshatch-prefixed': {
        'X{#var}': 'X#value',
        'X{#hello}': 'X#Hello%20World!'
      }
    },
    values: {
      'var': 'value',
      'hello': 'Hello World!',
      'path': '/foo/bar'
    }
  },
  'Level 3': {
    expressions: {
      'String expansion with multiple variables': {
        'map?{x,y}': 'map?1024,768',
        '{x,hello,y}': '1024,Hello%20World%21,768'
      },
      'Reserved expansion with multiple variables': {
        '{+x,hello,y}': '1024,Hello%20World!,768',
        '{+path,x}/here': '/foo/bar,1024/here'
      },
      'Fragment expansion with multiple variables': {
        '{#x,hello,y}': '#1024,Hello%20World!,768',
        '{#path,x}/here': '#/foo/bar,1024/here'
      },
      'Label expansion, dot-prefixed': {
        'X{.var}': 'X.value',
        'X{.x,y}': 'X.1024.768'
      },
      'Path segments, slash-prefixed': {
        '{/var}': '/value',
        '{/var,x}/here': '/value/1024/here'
      },
      'Path-style parameters, semicolon-prefixed': {
        '{;x,y}': ';x=1024;y=768',
        '{;x,y,empty}': ';x=1024;y=768;empty'
      },
      'Form-style query, ampersand-separated': {
        '{?x,y}': '?x=1024&y=768',
        '{?x,y,empty}': '?x=1024&y=768&empty='
      },
      'Form-style query continuation': {
        '?fixed=yes{&x}': '?fixed=yes&x=1024',
        '{&x,y,empty}': '&x=1024&y=768&empty='
      }
    },
    values: {
      'var': 'value',
      'hello': 'Hello World!',
      'empty': '',
      'path': '/foo/bar',
      'x': '1024',
      'y': '768'
    }
  },
  'Level 4': {
    expressions: {
      'String expansion with value modifiers': {
        '{var:3}': 'val',
        '{var:30}': 'value',
        '{list}': 'red,green,blue',
        '{list*}': 'red,green,blue',
        '{keys}': 'semi,%3B,dot,.,comma,%2C',
        '{keys*}': 'semi=%3B,dot=.,comma=%2C'
      },
      'Reserved expansion with value modifiers': {
        '{+path:6}/here': '/foo/b/here',
        '{+list}': 'red,green,blue',
        '{+list*}': 'red,green,blue',
        '{+keys}': 'semi,;,dot,.,comma,,',
        '{+keys*}': 'semi=;,dot=.,comma=,'
      },
      'Fragment expansion with value modifiers': {
        '{#path:6}/here': '#/foo/b/here',
        '{#list}': '#red,green,blue',
        '{#list*}': '#red,green,blue',
        '{#keys}': '#semi,;,dot,.,comma,,',
        '{#keys*}': '#semi=;,dot=.,comma=,'
      },
      'Label expansion, dot-prefixed': {
        'X{.var:3}': 'X.val',
        'X{.list}': 'X.red,green,blue',
        'X{.list*}': 'X.red.green.blue',
        'X{.keys}': 'X.semi,%3B,dot,.,comma,%2C',
        'X{.keys*}': 'X.semi=%3B.dot=..comma=%2C'
      },
      'Path segments, slash-prefixed': {
        '{/var:1,var}': '/v/value',
        '{/list}': '/red,green,blue',
        '{/list*}': '/red/green/blue',
        '{/list*,path:4}': '/red/green/blue/%2Ffoo',
        '{/keys}': '/semi,%3B,dot,.,comma,%2C',
        '{/keys*}': '/semi=%3B/dot=./comma=%2C'
      },
      'Path-style parameters, semicolon-prefixed': {
        '{;hello:5}': ';hello=Hello',
        '{;list}': ';list=red,green,blue',
        '{;list*}': ';list=red;list=green;list=blue',
        '{;keys}': ';keys=semi,%3B,dot,.,comma,%2C',
        '{;keys*}': ';semi=%3B;dot=.;comma=%2C'
      },

      'Form-style query, ampersand-separated': {
        '{?var:3}': '?var=val',
        '{?list}': '?list=red,green,blue',
        '{?list*}': '?list=red&list=green&list=blue',
        '{?keys}': '?keys=semi,%3B,dot,.,comma,%2C',
        '{?keys*}': '?semi=%3B&dot=.&comma=%2C'
      },
      'Form-style query continuation': {
        '{&var:3}': '&var=val',
        '{&list}': '&list=red,green,blue',
        '{&list*}': '&list=red&list=green&list=blue',
        '{&keys}': '&keys=semi,%3B,dot,.,comma,%2C',
        '{&keys*}': '&semi=%3B&dot=.&comma=%2C'
      }
    },
    values: {
      'var': 'value',
      'hello': 'Hello World!',
      'path': '/foo/bar',
      'list': ['red', 'green', 'blue'],
      'keys': {
        'semi': ';',
        'dot': '.',
        'comma': ','
      }
    }
  },
  // http://tools.ietf.org/html/rfc6570#section-3
  'Expression Expansion': {
    expressions: {
      'Variable Expansion': {
        '{count}': 'one,two,three',
        '{count*}': 'one,two,three',
        '{/count}': '/one,two,three',
        '{/count*}': '/one/two/three',
        '{;count}': ';count=one,two,three',
        '{;count*}': ';count=one;count=two;count=three',
        '{?count}': '?count=one,two,three',
        '{?count*}': '?count=one&count=two&count=three',
        '{&count*}': '&count=one&count=two&count=three'
      },
      'Simple String Expansion': {
        '{var}': 'value',
        '{hello}': 'Hello%20World%21',
        '{half}': '50%25',
        'O{empty}X': 'OX',
        'O{undef}X': 'OX',
        '{x,y}': '1024,768',
        '{x,hello,y}': '1024,Hello%20World%21,768',
        '?{x,empty}': '?1024,',
        '?{x,undef}': '?1024',
        '?{undef,y}': '?768',
        '{var:3}': 'val',
        '{var:30}': 'value',
        '{list}': 'red,green,blue',
        '{list*}': 'red,green,blue',
        '{keys}': 'semi,%3B,dot,.,comma,%2C',
        '{keys*}': 'semi=%3B,dot=.,comma=%2C'
      },
      'Reserved Expansion': {
        '{+var}': 'value',
        '{+hello}': 'Hello%20World!',
        '{+half}': '50%25',
        '{base}index': 'http%3A%2F%2Fexample.com%2Fhome%2Findex',
        '{+base}index': 'http://example.com/home/index',
        'O{+empty}X': 'OX',
        'O{+undef}X': 'OX',
        '{+path}/here': '/foo/bar/here',
        'here?ref={+path}': 'here?ref=/foo/bar',
        'up{+path}{var}/here': 'up/foo/barvalue/here',
        '{+x,hello,y}': '1024,Hello%20World!,768',
        '{+path,x}/here': '/foo/bar,1024/here',
        '{+path:6}/here': '/foo/b/here',
        '{+list}': 'red,green,blue',
        '{+list*}': 'red,green,blue',
        '{+keys}': 'semi,;,dot,.,comma,,',
        '{+keys*}': 'semi=;,dot=.,comma=,'
      },
      'Fragment Expansion': {
        '{#var}': '#value',
        '{#hello}': '#Hello%20World!',
        '{#half}': '#50%25',
        'foo{#empty}': 'foo#',
        'foo{#undef}': 'foo',
        '{#x,hello,y}': '#1024,Hello%20World!,768',
        '{#path,x}/here': '#/foo/bar,1024/here',
        '{#path:6}/here': '#/foo/b/here',
        '{#list}': '#red,green,blue',
        '{#list*}': '#red,green,blue',
        '{#keys}': '#semi,;,dot,.,comma,,',
        '{#keys*}': '#semi=;,dot=.,comma=,'
      },
      'Label Expansion with Dot-Prefix': {
        '{.who}': '.fred',
        '{.who,who}': '.fred.fred',
        '{.half,who}': '.50%25.fred',
        'www{.dom*}': 'www.example.com',
        'X{.var}': 'X.value',
        'X{.empty}': 'X.',
        'X{.undef}': 'X',
        'X{.var:3}': 'X.val',
        'X{.list}': 'X.red,green,blue',
        'X{.list*}': 'X.red.green.blue',
        'X{.keys}': 'X.semi,%3B,dot,.,comma,%2C',
        'X{.keys*}': 'X.semi=%3B.dot=..comma=%2C',
        'X{.empty_keys}': 'X',
        'X{.empty_keys*}': 'X'
      },
      'Path Segment Expansion': {
        '{/who}': '/fred',
        '{/who,who}': '/fred/fred',
        '{/half,who}': '/50%25/fred',
        '{/who,dub}': '/fred/me%2Ftoo',
        '{/var}': '/value',
        '{/var,empty}': '/value/',
        '{/var,undef}': '/value',
        '{/var,x}/here': '/value/1024/here',
        '{/var:1,var}': '/v/value',
        '{/list}': '/red,green,blue',
        '{/list*}': '/red/green/blue',
        '{/list*,path:4}': '/red/green/blue/%2Ffoo',
        '{/keys}': '/semi,%3B,dot,.,comma,%2C',
        '{/keys*}': '/semi=%3B/dot=./comma=%2C'
      },
      'Path-Style Parameter Expansion': {
        '{;who}': ';who=fred',
        '{;half}': ';half=50%25',
        '{;empty}': ';empty',
        '{;v,empty,who}': ';v=6;empty;who=fred',
        '{;v,bar,who}': ';v=6;who=fred',
        '{;x,y}': ';x=1024;y=768',
        '{;x,y,empty}': ';x=1024;y=768;empty',
        '{;x,y,undef}': ';x=1024;y=768',
        '{;hello:5}': ';hello=Hello',
        '{;list}': ';list=red,green,blue',
        '{;list*}': ';list=red;list=green;list=blue',
        '{;keys}': ';keys=semi,%3B,dot,.,comma,%2C',
        '{;keys*}': ';semi=%3B;dot=.;comma=%2C'
      },
      'Form-Style Query Expansion': {
        '{?who}': '?who=fred',
        '{?half}': '?half=50%25',
        '{?x,y}': '?x=1024&y=768',
        '{?x,y,empty}': '?x=1024&y=768&empty=',
        '{?x,y,undef}': '?x=1024&y=768',
        '{?var:3}': '?var=val',
        '{?list}': '?list=red,green,blue',
        '{?list*}': '?list=red&list=green&list=blue',
        '{?keys}': '?keys=semi,%3B,dot,.,comma,%2C',
        '{?keys*}': '?semi=%3B&dot=.&comma=%2C'
      },
      'Form-Style Query Continuation': {
        '{&who}': '&who=fred',
        '{&half}': '&half=50%25',
        '?fixed=yes{&x}': '?fixed=yes&x=1024',
        '{&x,y,empty}': '&x=1024&y=768&empty=',
        '{&x,y,undef}': '&x=1024&y=768',
        '{&var:3}': '&var=val',
        '{&list}': '&list=red,green,blue',
        '{&list*}': '&list=red&list=green&list=blue',
        '{&keys}': '&keys=semi,%3B,dot,.,comma,%2C',
        '{&keys*}': '&semi=%3B&dot=.&comma=%2C'
      }
    },
    values: {
      'count': ['one', 'two', 'three'],
      'dom': ['example', 'com'],
      'dub': 'me/too',
      'hello': 'Hello World!',
      'half': '50%',
      'var': 'value',
      'who': 'fred',
      'base': 'http://example.com/home/',
      'path': '/foo/bar',
      'list': ['red', 'green', 'blue'],
      'keys': {
        'semi': ';',
        'dot': '.',
        'comma': ','
      },
      'v': '6',
      'x': '1024',
      'y': '768',
      'empty': '',
      'empty_keys': [],
      'undef': null
    }
  }
};

describe('lib', () => {
  describe('url', () => {
    describe('UrlProcessor', () => {

      Object.keys(levels).forEach((key) => {
        describe(key, () => {
          const def = levels[key];
    
          Object.keys(def.expressions).forEach((testName) => {
            it(testName, () => {
              Object.keys(def.expressions[testName]).forEach((expression) => {
                const value = def.expressions[testName][expression];
                const template = new UrlProcessor(expression);
                const expansion = template.expand(def.values);
                assert.equal(expansion, value, `${testName}: ${expression}`);
              });
            });
          });
        });
      });

      describe('spec examples parsing', () => {
        const variables = {
          a: 'va',
          b: 'vb',
          c: 'vc',
          long: 'a-long-text-value',
          year: ["1965", "2000", "2012"],
          dom: ["example", "com"],
          count: ["one", "two", "three"],
          dub: "me/too",
          hello: "Hello World!",
          half: "50%",
          'var': "value",
          who: "fred",
          base: "http://example.com/home/",
          path: "/foo/bar",
          list: ["red", "green", "blue"],
          keys: { semi: ';', dot: '.', comma: ',' },
          v: "6",
          x: "1024",
          y: "768",
          empty: "",
          empty_keys: {},
          undef: null
        };
  
        const tests = {
          'https://api.com/path?a=b': 'https://api.com/path?a=b',
          'https://api.com/path?a={a}': 'https://api.com/path?a=va',
          '/path?a={a}': '/path?a=va',
          '/path{?a,b}': '/path?a=va&b=vb',
          '/path?test=true{&a,b}': '/path?test=true&a=va&b=vb',
          '/p?a={long:3}': '/p?a=a-l',
          'find{?year*}': 'find?year=1965&year=2000&year=2012',
          'www{.dom*}': 'www.example.com',
          '{count}': 'one,two,three',
          '{count*}': 'one,two,three',
          '{/count}': '/one,two,three',
          '{/count*}': '/one/two/three',
          '{;count}': ';count=one,two,three',
          '{;count*}': ';count=one;count=two;count=three',
          '{?count}': '?count=one,two,three',
          '{?count*}': '?count=one&count=two&count=three',
          '{&count*}': '&count=one&count=two&count=three',
          '{var}': 'value',
          '{hello}': 'Hello%20World%21',
          '{half}':  '50%25',
          'O{empty}X': 'OX',
          'O{undef}X': 'OX',
          '{x,y}': '1024,768',
          '{x,hello,y}': '1024,Hello%20World%21,768',
          '?{x,empty}': '?1024,',
          '?{x,undef}': '?1024',
          '?{undef,y}': '?768',
          '{var:3}': 'val',
          '{var:30}': 'value',
          '{list}': 'red,green,blue',
          '{list*}': 'red,green,blue',
          '{keys}': 'semi,%3B,dot,.,comma,%2C',
          '{keys*}': 'semi=%3B,dot=.,comma=%2C',
          '{+var}': 'value',
          '{+hello}': 'Hello%20World!',
          '{+half}': '50%25',
          '{base}index': 'http%3A%2F%2Fexample.com%2Fhome%2Findex',
          '{+base}index': 'http://example.com/home/index',
          'O{+empty}X': 'OX',
          'O{+undef}X': 'OX',
          '{+path}/here': '/foo/bar/here',
          'here?ref={+path}': 'here?ref=/foo/bar',
          'up{+path}{var}/here': 'up/foo/barvalue/here',
          '{+x,hello,y}': '1024,Hello%20World!,768',
          '{+path,x}/here': '/foo/bar,1024/here',
          '{+path:6}/here': '/foo/b/here',
          '{+list}': 'red,green,blue',
          '{+list*}': 'red,green,blue',
          '{+keys}': 'semi,;,dot,.,comma,,',
          '{+keys*}': 'semi=;,dot=.,comma=,',
          '{#var}': '#value',
          '{#hello}': '#Hello%20World!',
          '{#half}': '#50%25',
          'foo{#empty}': 'foo#',
          'foo{#undef}': 'foo',
          '{#x,hello,y}': '#1024,Hello%20World!,768',
          '{#path,x}/here': '#/foo/bar,1024/here',
          '{#path:6}/here': '#/foo/b/here',
          '{#list}': '#red,green,blue',
          '{#list*}': '#red,green,blue',
          '{#keys}': '#semi,;,dot,.,comma,,',
          '{#keys*}': '#semi=;,dot=.,comma=,',
          '{.who}': '.fred',
          '{.who,who}': '.fred.fred',
          '{.half,who}': '.50%25.fred',
          'X{.var}': 'X.value',
          'X{.empty}': 'X.',
          'X{.undef}': 'X',
          'X{.var:3}': 'X.val',
          'X{.list}': 'X.red,green,blue',
          'X{.list*}': 'X.red.green.blue',
          'X{.keys}': 'X.semi,%3B,dot,.,comma,%2C',
          'X{.keys*}': 'X.semi=%3B.dot=..comma=%2C',
          'X{.empty_keys}': 'X',
          'X{.empty_keys*}': 'X',
          '{/who}': '/fred',
          '{/who,who}': '/fred/fred',
          '{/half,who}': '/50%25/fred',
          '{/who,dub}': '/fred/me%2Ftoo',
          '{/var}': '/value',
          '{/var,empty}': '/value/',
          '{/var,undef}': '/value',
          '{/var,x}/here': '/value/1024/here',
          '{/var:1,var}': '/v/value',
          '{/list}': '/red,green,blue',
          '{/list*}': '/red/green/blue',
          '{/list*,path:4}': '/red/green/blue/%2Ffoo',
          '{/keys}': '/semi,%3B,dot,.,comma,%2C',
          '{/keys*}': '/semi=%3B/dot=./comma=%2C',
          '{;who}': ';who=fred',
          '{;half}': ';half=50%25',
          '{;empty}': ';empty',
          '{;v,empty,who}': ';v=6;empty;who=fred',
          '{;v,bar,who}': ';v=6;who=fred',
          '{;x,y}': ';x=1024;y=768',
          '{;x,y,empty}': ';x=1024;y=768;empty',
          '{;x,y,undef}': ';x=1024;y=768',
          '{;hello:5}': ';hello=Hello',
          '{;list}': ';list=red,green,blue',
          '{;list*}': ';list=red;list=green;list=blue',
          '{;keys}': ';keys=semi,%3B,dot,.,comma,%2C',
          '{;keys*}': ';semi=%3B;dot=.;comma=%2C',
          '{?who}': '?who=fred',
          '{?half}': '?half=50%25',
          '{?x,y}': '?x=1024&y=768',
          '{?x,y,empty}': '?x=1024&y=768&empty=',
          '{?x,y,undef}': '?x=1024&y=768',
          '{?var:3}': '?var=val',
          '{?list}': '?list=red,green,blue',
          '{?list*}': '?list=red&list=green&list=blue',
          '{?keys}': '?keys=semi,%3B,dot,.,comma,%2C',
          '{?keys*}': '?semi=%3B&dot=.&comma=%2C',
          '{&who}': '&who=fred',
          '{&half}': '&half=50%25',
          '?fixed=yes{&x}': '?fixed=yes&x=1024',
          '{&x,y,empty}': '&x=1024&y=768&empty=',
          '{&x,y,undef}': '&x=1024&y=768',
          '{&var:3}': '&var=val',
          '{&list}': '&list=red,green,blue',
          '{&list*}': '&list=red&list=green&list=blue',
          '{&keys}': '&keys=semi,%3B,dot,.,comma,%2C',
          '{&keys*}': '&semi=%3B&dot=.&comma=%2C',
        };
  
        Object.keys(tests).forEach((expression) => {
          it(`expands ${expression}`, () => {
            const parser = new UrlProcessor(expression);
            const result = parser.expand({ ...variables });
            // @ts-ignore
            const compare = tests[expression];
            assert.equal(result, compare);
          });
        });
      });

      describe('query parameters manipulation', () => {
        const variables = {
          a: 'va',
          b: 'vb',
          c: 'vc',
          long: 'a-long-text-value',
          year: ["1965", "2000", "2012"],
          dom: ["example", "com"],
          count: ["one", "two", "three"],
          dub: "me/too",
          hello: "Hello World!",
          half: "50%",
          'var': "value",
          who: "fred",
          base: "http://example.com/home/",
          host: 'example.com',
          path: "/foo/bar",
          list: ["red", "green", "blue"],
          keys: { semi: ';', dot: '.', comma: ',' },
          v: "6",
          x: "1024",
          y: "768",
          empty: "",
          empty_keys: {},
          undef: null
        };

        it('manipulates query parameters after template expression', () => {
          const parser = new UrlProcessor('/{?v}&a=b');
          parser.search.set('a', 'c');
          const result = parser.expand({ ...variables });
          assert.equal(result, '/?v=6&a=c');
        });

        it('manipulates query parameters after composite values', () => {
          const parser = new UrlProcessor('find{?year*}&a=b');
          parser.search.set('a', 'c');
          parser.search.append('x', 'x1');
          parser.search.append('x', 'x2');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'find?year=1965&year=2000&year=2012&a=c&x=x1&x=x2');
        });

        it('manipulates query parameters before template expression', () => {
          const parser = new UrlProcessor('/?a=b{&v}');
          parser.search.set('a', 'c');
          const result = parser.expand({ ...variables });
          assert.equal(result, '/?a=c&v=6');
        });

        it('manipulates query parameters before composite values', () => {
          const parser = new UrlProcessor('find?a=b{&year*}');
          parser.search.set('a', 'c');
          parser.search.append('x', 'x1');
          parser.search.append('x', 'x2');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'find?a=c&year=1965&year=2000&year=2012&x=x1&x=x2');
        });

        it('manipulates query parameters when expression before query parameters', () => {
          const parser = new UrlProcessor('http://{+host}{+path}{?v}&a=b');
          parser.search.set('a', 'c');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'http://example.com/foo/bar?v=6&a=c');
        });

        it('manipulates query parameters without expressions', () => {
          const parser = new UrlProcessor('http://api.com?a=b');
          parser.search.set('a', 'c');
          parser.search.append('d', 'e');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'http://api.com?a=c&d=e');
        });

        it('manipulates parameters for https://api.com/path?a=b', () => {
          const parser = new UrlProcessor('http://api.com?a=b');
          parser.search.append('x', 'x1');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'http://api.com?a=b&x=x1');
        });

        it('manipulates parameters for https://api.com/path?a={a}', () => {
          const parser = new UrlProcessor('http://api.com?a={a}');
          parser.search.append('x', 'x1');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'http://api.com?a=va&x=x1');
        });

        it('manipulates parameters for https://api.com/path?{dub}=test', () => {
          const parser = new UrlProcessor('http://api.com/path{?dub}');
          parser.search.append('x', 'x1');
          const result = parser.expand({ ...variables });
          assert.equal(result, 'http://api.com/path?dub=me%2Ftoo&x=x1');
        });

        it('manipulates parameters for /path?test=true{&a,b}', () => {
          const parser = new UrlProcessor('/path?test=true{&a,b}');
          parser.search.append('x', 'x1');
          const result = parser.expand({ ...variables });
          assert.equal(result, '/path?test=true&a=va&b=vb&x=x1');
        });

        it('removes a parameter', () => {
          const parser = new UrlProcessor('/path?test=true{&a,b}');
          parser.search.delete(0);
          const result = parser.expand({ ...variables });
          assert.equal(result, '/path&a=va&b=vb');
        });

        it('updates a parameter', () => {
          const parser = new UrlProcessor('/path?test=true{&a,b}&c=d');
          const params = parser.search.list();
          params[0].value = 'false';
          params[1].name = 'e';
          parser.search.update(0, params[0]);
          parser.search.update(1, params[1]);
          const result = parser.expand({ ...variables });
          assert.equal(result, '/path?test=false&a=va&b=vb&e=d');
        });

        it('disables a parameter', () => {
          const parser = new UrlProcessor('/path?test=true{&a,b}&c=d');
          parser.search.toggle(1, false);
          const result = parser.expand({ ...variables });
          assert.equal(result, '/path?test=true&a=va&b=vb');
        });

        it('has the iterator', () => {
          const parts: IUrlParamPart[] = [];
          const parser = new UrlProcessor('/path?a=b{&a,b}&c=d');
          for (const part of parser.search) {
            parts.push(part);
          }
          assert.lengthOf(parts, 2, 'has 2 parts');
          assert.equal(parts[0].name, 'a');
          assert.equal(parts[1].name, 'c');
        });
      });

      describe('toString()', () => {
        it('manipulates query parameters after template expression', () => {
          const parser = new UrlProcessor('/{?v}&a=b');
          parser.search.set('a', 'c');
          const result = parser.toString();
          assert.equal(result, '/{?v}&a=c');
        });

        it('manipulates query parameters after composite values', () => {
          const parser = new UrlProcessor('find{?year*}&a=b');
          parser.search.set('a', 'c');
          parser.search.append('x', 'x1');
          parser.search.append('x', 'x2');
          const result = parser.toString();
          assert.equal(result, 'find{?year*}&a=c&x=x1&x=x2');
        });

        it('manipulates query parameters before template expression', () => {
          const parser = new UrlProcessor('/?a=b{&v}');
          parser.search.set('a', 'c');
          const result = parser.toString();
          assert.equal(result, '/?a=c{&v}');
        });

        it('manipulates query parameters before composite values', () => {
          const parser = new UrlProcessor('find?a=b{&year*}');
          parser.search.set('a', 'c');
          parser.search.append('x', 'x1');
          parser.search.append('x', 'x2');
          const result = parser.toString();
          assert.equal(result, 'find?a=c{&year*}&x=x1&x=x2');
        });

        it('manipulates query parameters when expression before query parameters', () => {
          const parser = new UrlProcessor('http://{+host}{+path}{?v}&a=b');
          parser.search.set('a', 'c');
          const result = parser.toString();
          assert.equal(result, 'http://{+host}{+path}{?v}&a=c');
        });

        it('manipulates query parameters without expressions', () => {
          const parser = new UrlProcessor('http://api.com?a=b');
          parser.search.set('a', 'c');
          parser.search.set('d', 'e');
          const result = parser.toString();
          assert.equal(result, 'http://api.com?a=c&d=e');
        });

        it('manipulates parameters for https://api.com/path?a=b', () => {
          const parser = new UrlProcessor('http://api.com?a=b');
          parser.search.set('x', 'x1');
          const result = parser.toString();
          assert.equal(result, 'http://api.com?a=b&x=x1');
        });

        it('manipulates parameters for http://api.com/path?a={a}', () => {
          const parser = new UrlProcessor('http://api.com/path?a={a}');
          parser.search.set('x', 'x1');
          const result = parser.toString();
          assert.equal(result, 'http://api.com/path?a={a}&x=x1');
        });

        it('manipulates parameters for https://api.com/path?{dub}=test', () => {
          const parser = new UrlProcessor('http://api.com/path{?dub}');
          parser.search.set('x', 'x1');
          const result = parser.toString();
          assert.equal(result, 'http://api.com/path{?dub}&x=x1');
        });

        it('manipulates parameters for /path?test=true{&a,b}', () => {
          const parser = new UrlProcessor('/path?test=true{&a,b}');
          parser.search.set('x', 'x1');
          const result = parser.toString();
          assert.equal(result, '/path?test=true{&a,b}&x=x1');
        });
      });

      describe('Processing errors', () => {
        it('throws for prefix modifier after composite variable', () => {
          assert.throws(() => {
            const data = { 'composite_var': ['multiple', 'values'] };
            new UrlProcessor('{composite_var:3}').expand(data, { strict: true });
          }, Error);
        });
    
        it('throws in strict mode', function () {
          assert.throws(() => {
            new UrlProcessor('/{foo}/bar').expand({ foobar: 123 }, { strict: true });
          }, Error, 'Missing expansion value for variable "foo"');
        });
      });
    });
  });
});
