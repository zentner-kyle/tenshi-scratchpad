var require = require;
var export_val;
var exported_symbols = [];
if ( require === undefined ) {
  export_val = function ( name, val ) {
    exported_symbols.push ( name );
    };
  require = function ( filename ) {
    return components.utils.import("chrome://angel-player/content/angelic/" + filename);
    };
  }
else {
  export_val = function ( name, val ) {
    exports[name] = val;
    };
  }

var main = function ( ) {
  var xregexp = require ( './xregexp/xregexp-all.js' );
  var string_map = require ( './string_map.js' );
  var scope = require ( './scope.js' );
  var misc = require ( './misc.js' );

  function debug ( ) {
    console.log.apply ( console, arguments );
    }

  var lex = function ( ) {
    var token_reg = xregexp ( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  ' ,
        'x' );
    var types = ['space', 'number', 'identifier', 'operator'];
    return function lex ( text ) {
      var match = xregexp.exec ( text, token_reg );
      if ( !match ) {
        return null;
        }
      for ( var t in types ) {
        if ( match[types[t]] !== undefined ) {
          return {type: types[t], text: match[types[t]]};
          }
        }
      };
    } ( );

  function infix ( lbp, rbp ) {
    rbp = rbp !== undefined ? rbp : lbp;
    return {
      led: function ( parser, left ) {
        this.left = left;
        this.right = parser.expr ( rbp );
        return this;
        },
      lbp: lbp,
      };
    }

  function prefix ( rbp ) {
    return {
      nud: function ( parser ) {
        this.right = parser.expr ( rbp );
        return this;
        },
      };
    }

  var make = function ( ) {

    var atom = {
      lbp: 0,
      nud: function ( parser ) {
        return this;
        },
      };

    var end_token = {
      'text':'(end)',
      'type':'special',
      };
    var infix_table = string_map.make ( {
      '+' : 60,
      '-' : 60,
      '*' : 70,
      '/' : 70,
      '%' : 70,
      '==': 40,
      '!=': 40,
      } ).map ( function ( key, val ) { return infix ( val ); } );
    var prefix_table = string_map.make ( {
      '+' : 80,
      '-' : 80,
      '++' : 90,
      '--' : 90,
      } ).map ( function ( key, val ) { return prefix ( val ); } );
    var type_table = string_map.make ( {
      'identifier' : atom,
      'number' : atom,
      'space' : atom,
      } );
    var escope = scope.make ( );

    escope.load_text ( infix_table );
    escope.load_text ( prefix_table );
    escope.load_type ( type_table );

    var sscope = scope.make ( escope );
    sscope.load_text ( string_map.make ( {
      '=' : infix(10),
      ':' : { lbp: 0 },
      'while': {
        nud: function ( parser ) {
          this.condition = parser.expr ( );
          var out = parser.advance ( ':' );
          this.block = parser.block ( );
          return this;
          },
        },
      } ) );
    sscope.load_type ( string_map.make ( {
      'identifier' : atom,
       } ) );

    var root_parser = {
      lookup_token: function lookup_token ( token, scope ) {
        var to_clone;

        if ( scope === undefined ) {
          scope = this.scope;
          }

        if ( token === undefined ) {
          to_clone = end_token;
          }
        else {
          to_clone = scope.get_text ( token.text );
          if ( to_clone === undefined ) {
            to_clone = scope.get_type ( token.type );
            }
          }

        if ( to_clone !== undefined && to_clone.make !== undefined ) {
          return to_clone.make ( token );
          }

        var out = misc.obj_or ( Object.create ( to_clone || {} ), token );
        return out;
        },
      get_token: function get_token ( index ) {
        var token;
        
        if ( index === undefined ) {
          index = this.token_idx;
          }

        while ( index >= this.tokens.length ) {
          token = lex ( this.text.substr ( this.text_idx ) );
          if ( ! token ) {
            return end_token;
            }

          this.text_idx += token.text.length;
          this.tokens.push ( token );
          }
        return this.tokens[index];
        },
      handle_error: function handle_error ( expected, other ) {
        console.log ( 'expected', expected );
        console.log ( 'got', other );
        },
      match: function match ( matcher, token ) {

        if ( ! matcher ) {
          return false;
          }

        if ( matcher.type === undefined &&
             matcher.text === undefined ) {
          return true;
          }

        if ( matcher.type !== undefined  &&
             matcher.text !== undefined ) {
          return token.text === matcher.text &&
                 token.type === matcher.type;
          } 

        if ( matcher.type !== undefined ) {
          if ( matcher.type === token.type ) {
            return true;
            }
          }

        if ( matcher.text !== undefined ) {
          if ( matcher.text === token.text ) {
            return true;
            }
          }
        return false;
        },
      advance: function advance ( expected ) {
        var token;
        var skip = { type: 'space' };
        var idx = this.token_idx;
        var peek = expected && expected.peek;

        if ( ! ( expected instanceof Object ) ) {
          expected = { text: expected };
          }

        if ( expected && expected.skip !== undefined ) {
          skip = expected.skip;
          }

        token = this.get_token ( idx + 1 );
        while ( this.match ( skip, token ) ) {
          idx += 1;
          token = this.get_token ( idx + 1 );
          }
        if ( expected && ! this.match ( expected, token ) ) {
          if ( peek ) {
            return null;
            }
          else {
            this.handle_error ( expected );
            }
          }
        else {
          if ( ! peek ) {
            this.token_idx = idx + 1;
            }
          }
        return this.lookup_token ( this.get_token ( idx + 1 ) );
        },
      expr: function expr ( rbp, scope ) {
        var left;
        var t;
        var old_scope = this.scope;

        if ( rbp === undefined ) {
          rbp = 0;
          }
        if ( scope === undefined ) {
          scope = this.scopes.get ( 'statement' );
          }

        this.scope = scope;
        t = this.advance ( );

        left = t.nud ( this );
        while ( rbp < this.advance ( { peek: true } ).lbp ) {
          t = this.advance ( );
          left = t.led ( this, left );
          }
        this.scope = old_scope;
        return left;
        },
      more: function more ( ) {
        return this.text_idx !== this.text.length;
        },
      statement: function statement ( ) {
        return this.expr ( 0, this.scopes.get ( 'statement' ) );
        },
      block: function block ( indent ) {
        var block = this.lookup_token ( { text: 'block' }, this.scopes.get ( 'statement' ) );
        var token = this.advance ( { type: 'space', peek: true, skip: null } );
        var child;

        indent = indent || ( token && token.text.replace ( '\n', '' ) ) || '';

        while ( this.more ( ) ) {
          token = this.advance ( { type: 'space', peek: true, skip: null } );
          if ( token && token.text.replace('\n', '') !== indent ) {
            return block;
            }
          child = this.statement ( );
          block.children.push ( child );
          }
        return block;
        },
      setupScopes: function setupScopes ( scopes ) {
        var escope = scopes.get ( 'expression', scope.make ( ) );
        var sscope = scopes.get ( 'statement', scope.make ( escope ) );

        this.scopes = scopes;

        escope.load_text ( infix_table );
        escope.load_text ( prefix_table );
        escope.load_type ( type_table );
        sscope.load_text ( string_map.make ( {
          '=' : infix(10),
          ':' : { lbp: 0 },
          'while': {
            nud: function ( parser ) {
              this.condition = parser.expr ( );
              var out = parser.advance ( ':' );
              this.block = parser.block ( );
              return this;
              },
            },
          'block': { text: 'block',
            make: function make_block ( token ) {
              var out = misc.obj_or ( Object.create ( this ), token );
              out.children = [];
              return out;
              } },
          } ) );
        sscope.load_type ( string_map.make ( {
           } ) );
        },
      parse: function parse ( text ) {
        this.text = text;
        this.scope = this.scopes.get ( 'statement' );
        return this.block ( );
        },
      };
    return function ( text ) {
      return misc.obj_or ( Object.create ( root_parser ), {
        tokens: [],
        text: text || "",
        token_idx: -1,
        text_idx: 0,
        scope: scope.make ( ),
        line_num: 0,
        } );
      };
    } ( );
  export_val ( 'make', make );
  };
main ( );
