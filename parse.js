var util = require ( 'util' );
var xregexp = require ( './xregexp/xregexp-all.js' );

var main = function ( xregexp ) {

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

  function obj_or ( obja, objb ) {
    var k;
    for ( k in objb ) {
      obja[k] = objb[k];
      }
    return obja;
    }

  function string_map ( obj ) {
    var storage = {};

    if ( obj !== undefined ) {
      for ( var k in obj ) {
        storage[k + '$'] = obj[k];
        }
      }
    return {
      'get': function ( key ) {
        return storage[key + '$'];
        },
      'set': function ( key, val ) {
        storage[key + '$'] = val;
        return this;
        },
      'has': function ( key ) {
        return key + '$' in storage;
        },
      'delete': function ( key ) {
        return delete storage[key + '$'];
        },
      'map': function ( func ) {
        var self = this;

        this.each ( function ( key, val ) {
          self.set ( key, func ( key, val ) );
          } );
        return this;
        },
      'each': function ( func ) {
        var key;
        var val;

        for ( key in storage ) {
          val = storage[key];
          key = key.substr( 0, key.length - 1 );
          func ( key, val );
          }
        return this;
        },
      'toString': function ( val_str ) {
        var out = '{';


        if ( val_str === undefined ) {
          val_str = function ( val ) {
            return val.toString ( );
            };
          }
        this.each ( function ( key, val ) {
          out += '' + key + ' : ' + val_str ( val ) + ',';
          } );

        out += '}';
        return out;
        },
      };
    }

  var make_scope = function ( ) {
    var root = {
      get_text: function ( key ) {
        return undefined;
        },
      get_type: function ( key ) {
        return undefined;
        },
      set_text: function ( key, val ) {
        },
      set_type: function ( key, val ) {
        },
      reset_text: function ( key, val ) {
        },
      reset_type: function ( key, val ) {
        },
      load_text: function ( table ) {
        return this;
        },
      load_type: function ( table ) {
        return this;
        },
      };
    return function make_scope ( prev_scope ) {
      var text_table = string_map ( );
      var type_table = string_map ( );

      if ( prev_scope === undefined ) {
        prev_scope = root;
        }
      return {
        map_text: function ( func ) {
          text_table.map ( func );
          return this;
          },
        map_type: function ( func ) {
          type_table.map ( func );
          return this;
          },
        load_text: function ( table ) {
          var self = this;

          table.each ( function ( key, val ) {
            self.set_text ( key, obj_or ( self.get_text ( key ) || Object.create(null), val ) );
            } );
          return this;
          },
        load_type: function ( table ) {
          var self = this;

          table.each ( function ( key, val ) {
            self.set_type ( key, obj_or ( self.get_type ( key ) || Object.create(null), val ) );
            } );
          return this;
          },
        load: function ( other ) {
          var self = this;

          other.map_text ( function ( key, val ) {
            return obj_or ( self.get_text ( key ), val );
            } );
          other.map_text ( function ( key, val ) {
            return obj_or ( self.get_type ( key ), val );
            } );
          return this;
          },
        get_text: function ( key ) {
          if ( text_table.has ( key ) ) {
            return text_table.get ( key );
            }
          else {
            return prev_scope.get_text ( key );
            }
          },
        get_type: function ( key ) {
          if ( type_table.has ( key ) ) {
            return type_table.get ( key );
            }
          else {
            return prev_scope.get_type ( key );
            }
          },
        set_text: function ( key, val ) {
          text_table.set ( key, val );
          return this;
          },
        reset_text: function ( key, val ) {
          if ( text_table.has ( key ) ) {
            text_table.set ( key, val );
            }
          else {
            prev_scope.reset_text ( key, val );
            }
          return this;
          },
        set_type: function ( key, val ) {
          type_table.set ( key, val );
          return this;
          },
        reset_type: function ( key, val ) {
          if ( type_table.has ( key ) ) {
            type_table.set ( key, val );
            }
          else {
            prev_scope.reset_type ( key, val );
            }
          return this;
          },
        debug_print: function ( ) {
          console.log ( 'text' );
          this.map_text ( function ( key, val ) {
            console.log ( key, val );
            return val;
            } );
          console.log ( 'type' );
          this.map_type ( function ( key, val ) {
            console.log ( key, val );
            return val;
            } );
          },
        toString: function ( ) {
          return text_table.toString ( ) + type_table.toString ( );
          }
        };
      }
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

  var make_parser = function ( ) {

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
    var infix_table = string_map ( {
      '+' : 60,
      '-' : 60,
      '*' : 70,
      '/' : 70,
      '%' : 70,
      } ).map ( function ( key, val ) { return infix ( val ); } );
    var prefix_table = string_map ( {
      '+' : 80,
      '-' : 80,
      '++' : 90,
      '--' : 90,
      } ).map ( function ( key, val ) { return prefix ( val ); } );
    var type_table = string_map ( {
      'identifier' : atom,
      'number' : atom,
      'space' : atom,
      } );
    var escope = make_scope ( );

    escope.load_text ( infix_table );
    escope.load_text ( prefix_table );
    escope.load_type ( type_table );

    var sscope = make_scope ( );
    sscope.load_text ( string_map ( {
      '=' : infix(10),
      } ) );
    sscope.load_type ( string_map ( {
      'identifier' : atom,
       } ) );

    //escope.debug_print ( );
    sscope.debug_print ( );

    var root_parser = {
      lookup_token: function lookup_token ( token ) {
        var to_clone;

        if ( token === undefined ) {
          to_clone = end_token;
          }
        else {
          to_clone = this.scope.get_text ( token.text );
          if ( to_clone === undefined ) {
            to_clone = this.scope.get_type ( token.type );
            }
          }

        if ( to_clone === undefined ) {
          this.handle_error ( 'token', token );
          }

        return obj_or ( Object.create ( to_clone || {} ), token );
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
        return this.lookup_token ( this.tokens[index] );
        },
      handle_error: function handle_error ( expected, other ) {
        console.log ( 'expected', expected );
        console.log ( 'got', other );
        },
      //sadvance: function advance ( expected ) {
        //var token;

        //token = this.get_token ( this.token_idx );
        //if ( ! token || ( expected !== undefined && token.text !== expected ) ) {
          //this.handle_error ( expected );
          //}
        //else {
          //this.token_idx += 1;
          //}
        //},
      advance: function advance ( expected ) {
        var token;

        console.log ( 'advancing' );

        token = this.get_token ( this.token_idx + 1 );
        while ( token && token.type === 'space' ) {
          this.token_idx += 1;
          token = this.get_token ( this.token_idx + 1 );
          }
        if ( ! token || ( expected !== undefined && token.text !== expected ) ) {
          this.handle_error ( expected );
          }
        else {
          this.token_idx += 1;
          }
        },
      expr: function expr ( rbp ) {
        var left;
        var t;
        var old_scope = this.scope;

        this.scope = escope;
        t = this.get_token ( );

        if ( rbp === undefined ) {
          rbp = 0;
          }

        this.advance ( );
        left = t.nud ( this );
        while ( rbp < this.get_token ( ).lbp ) {
          t = this.get_token ( );
          this.advance ( );
          left = t.led ( this, left );
          }
        this.scope = old_scope;
        return left;
        },
      more: function more ( ) {
        return this.text_idx !== this.text.length;
        },
      statement: function statement ( rbp ) {
        var left;
        var t;
        var old_scope = this.scope;

        this.scope = sscope;
        t = this.get_token ( );

        if ( rbp === undefined ) {
          rbp = 0;
          }

        this.advance ( );
        console.log ( 't', t );
        left = t.nud ( this );
        while ( rbp < this.get_token ( ).lbp ) {
          t = this.get_token ( );
          this.advance ( );
          left = t.led ( this, left );
          }
        this.scope = old_scope;
        return left;
        },
      block: function block ( indent ) {
        var root = { text: '(root)', children: [] };

        if ( indent === undefined ) {
          indent = '';
          }

        while ( this.more ( ) ) {
          console.log ( 'children', root.children );
          root.children.push ( this.statement ( ) );
          }
        return root;
        }
      };
    return function ( text ) {
      return obj_or ( Object.create ( root_parser ), {
        tokens: [],
        text: text || "",
        token_idx: 0,
        text_idx: 0,
        scope: make_scope ( ),
        line_num: 0,
        } );
      };
    } ( );

  var to_parse = '' +
  'n = 100\n' +
  'a = 1\n' +
  'b = 1\n';
  //+
  //'while n != 0:\n' +
  //'    temp = a + b\n' +
  //'    a = b\n' +
  //'    b = temp\n' +
  //'    n = n - 1\n';
  console.log ( 'parsing', to_parse );
  console.log ( util.inspect ( make_parser ( to_parse ).block ( ), { colors: true, depth: 100 } ) );
  //console.log ( util.inspect ( make_parser ( '++apple + -1 - - bad' ).expr ( ), { colors: true, depth: 100 } ) );
  };
main ( xregexp );
