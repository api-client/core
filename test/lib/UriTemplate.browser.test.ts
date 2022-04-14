import { assert } from '@esm-bundle/chai';
import { UriTemplate } from '../../src/lib/parsers/UriTemplate.js';

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

describe('lib/UriTemplate', () => {
  Object.keys(levels).forEach((key) => {
    describe(key, () => {
      const def = levels[key];

      let combined_expression = '';
      let combined_expansion = '';

      Object.keys(def.expressions).forEach((testName) => {
        it(testName, () => {
          Object.keys(def.expressions[testName]).forEach((expression) => {
            const value = def.expressions[testName][expression];
            combined_expression += '/' + expression;
            combined_expansion += '/' + value;
            const template = new UriTemplate(expression);
            const expansion = template.expand(def.values);
            assert.equal(expansion, value, testName + ': ' + expression);
          });

          const template = new UriTemplate(combined_expression);
          const expansion = template.expand(def.values);
          assert.equal(expansion, combined_expansion, testName + ': combined');
        });
      });
    });
  });

  describe('Data Callbacks', function () {
    it('asks for the data', () => {
      const template = new UriTemplate('{var}');
      const global = (key: string): string => {
        const data = { 'var': 'hello world.html' };
        return data[key];
      };
      const local = (): string => 'hello world.html';

      assert.equal(template.expand(global), 'hello%20world.html', 'global callback');
      assert.equal(template.expand({ 'var': local }), 'hello%20world.html', 'local callback');
    });
  });

  describe('Processing errors', () => {
    it('throws for invalid variable name', () => {
      assert.throws(() => {
        new UriTemplate('AB{var$}IJ').parse();
      }, Error);
    });

    it('throws for invalid operator', () => {
      assert.throws(() => {
        new UriTemplate('AB{$var}IJ').parse();
      }, Error);
    });

    it('throws for missing closing character', () => {
      assert.throws(() => {
        new UriTemplate('AB{var:3IJ').parse();
      }, Error);
    });

    it('throws for invalid modifier', () => {
      assert.throws(() => {
        new UriTemplate('AB{var:3*}IJ').parse();
      }, Error);
    });

    it('throws for prefix modifier after composite variable', () => {
      assert.throws(() => {
        const data = { 'composite_var': ['multiple', 'values'] };
        new UriTemplate('{composite_var:3}').expand(data);
      }, Error);
    });

    it('throws for invalid literals', function () {
      assert.throws(() => {
        new UriTemplate('invalid.char}acter').parse();
      }, Error, 'Invalid Literal "invalid.char}acter"');
    });

    it('throws in strict mode', function () {
      assert.throws(() => {
        new UriTemplate('/{foo}/bar').expand({ foobar: 123 }, { strict: true });
      }, Error, 'Missing expansion value for variable "foo"');
    });
  });

  describe('Periods in variable names', () => {
    it('expands the uri', () => {
      const template = new UriTemplate('{hello.world.var}');
      const literal = 'replacement';
      const data = { 'hello.world.var': literal };
      const expansion = template.expand(data);
      assert.equal(expansion, literal, 'period in variable name');
    });
  });
});
