var util = require ( 'util' );
var xregexp = require ( './xregexp/xregexp-all.js' );

var main = function ( xregexp ) {

  var lex = function ( ) {
    var token_reg = xregexp ( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
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
      }
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
        //console.log ( key, '=', val );
        storage[key + '$'] = val;
        },
      'has': function ( key ) {
        //console.log ( storage );
        return key + '$' in storage;
        },
      'delete': function ( key ) {
        return delete storage[key + '$'];
        }
      };
    };

  var scope = function () {
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
        },
      load_type: function ( table ) {
        },
      };
    function scope ( prev_scope ) {
      var text_table = string_map ( );
      var type_table = string_map ( );

      if ( prev_scope === undefined ) {
        prev_scope = root;
        }
      return {
        get_text: function ( key ) {
          if ( text_table.has ( key ) ) {
            return text_table.get ( key );
            }
          else {
            //console.log ( 'could not find', key, 'looking in previous scope' );
            
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
        load_text: function ( table ) {
          var key;
          for ( key in table ) {
            this.set_text ( key, table[key] );
            }
          },
        load_type: function ( table ) {
          var key;
          for ( key in table ) {
            this.set_type ( key, table[key] );
            }
          },
        };
      };
    return scope;
    } ();

  //var lexAll = function ( text ) {
    //var idx = 0;
    //var out = [];
    //var tok;
    //while ( idx < text.length ) {
      //tok = lex ( text.substr ( idx ) );
      //idx += tok.text.length;
      //out.push ( tok );
      //}
    //return out;
    //};

  //function tableStackGet ( stack, key ) {
    //var i = stack.length - 1;
    //var res;
    //while ( i >= 0 ) {
      //res = stack[i][key];
      //if ( res !== undefined ) {
        //return res;
        //}
      //else {
        //i -= 1;
        //}
      //}
    //return undefined;
    //};

  //function tableStackSetNew ( stack, key, val ) {
    //stack[stack.length - 1][key] = val;
    //};

  //function tableStackChange ( stack, key, val ) {
    //var i = stack.length - 1;
    //var res;
    //while ( i >= 0 ) {
      //if ( key in stack[i] ) {
        //stack[i][key] = val;
        //return;
        //}
      //}
    //throw new Error ( 'Could not change key ' + key + ' to ' + val + ' in ' + stack + '.' );
    //};


  function infix ( lbp, rbp ) {
    rbp = rbp !== undefined ? rbp : lbp;
    //console.log ( rbp )
    return {
      led: function ( parser, left ) {
        this.left = left;
        this.right = parser.expr ( rbp );
        return this;
        },
      lbp: lbp,
      };
    };

  function prefix ( rbp ) {
    return {
      nud: function ( parser ) {
        this.right = parser.expr ( rbp );
        return this;
        },
      };
    };

  var make_parser = function () {

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
    var escope = scope ( );
    escope.set_text ( '+', infix ( 60 ) );
    escope.set_text ( '-', obj_or ( prefix ( 80 ), infix ( 60 ) ));
    escope.set_text ( '++', prefix ( 90 ) );
    escope.set_type ( 'identifier', atom );
    escope.set_type ( 'number', atom );
    escope.set_type ( 'space', atom );
    var root_parser = {
      lookup_token: function lookup_token ( token ) {
        var to_clone;

        if ( token === undefined ) {
          //console.log ( 'Reached end!' );
          to_clone = end_token;
          }
        else {
          to_clone = this.scope.get_text ( token.text );
          //console.log ( 'to_clone', to_clone );
          if ( to_clone === undefined ) {
            to_clone = this.scope.get_type ( token.type );
            }
          }

        if ( to_clone === undefined ) {
          this.handle_error ( 'token', token );
          }

        //console.log ( 'cloning', to_clone );
        return obj_or ( Object.create ( to_clone || {} ), token );
        },
      get_token: function get_token ( index ) {
        var token;
        
        //console.log ( 'index', index );

        if ( index === undefined ) {
          index = this.token_idx;
          }

        while ( index >= this.tokens.length ) {
          token = lex(this.text.substr(this.text_idx));
          if ( ! token ) {
            return null;
            }

          this.text_idx += token.text.length;
          this.tokens.push ( token );
          }
        //var out = this.tokens[this.token_idx];
        //console.log ( out );
        //return out;
        return this.lookup_token ( this.tokens[index] );
        },
      handle_error: function handle_error ( expected, other ) {
        //console.log ( 'expected', expected );
        //console.log ( 'got', other );
        },
      sadvance: function advance ( expected ) {
        var token;

        token = this.get_token ( this.token_idx );
        if ( ! token || ( expected !== undefined && token.text !== expected ) ) {
          this.handle_error ( expected );
          }
        else {
          this.token_idx += 1;
          }
        },
      advance: function advance ( expected ) {
        var token;

        token = this.get_token ( this.token_idx + 1 );
        //console.log ( 'idx', this.token_idx + 1 );
        //console.log ( 'token', token );
        while ( token && token.type === 'space' ) {
          //console.log ( 'skipping space' );
          this.token_idx += 1;
          token = this.get_token ( this.token_idx + 1 );
          //console.log ( 'idx', this.token_idx + 1 );
          }
        if ( ! token || ( expected !== undefined && token.text !== expected ) ) {
          this.handle_error ( expected );
          }
        else {
          //console.log ( 'token_idx', this.token_idx );
          this.token_idx += 1;
          }
        },
      expr: function expr ( rbp ) {
        var left;
        var t;

        this.scope = escope;
        t = this.get_token ( );
        //console.log ( 't', t );

        if ( rbp === undefined ) {
          rbp = 0;
          }

        //console.log ( 'advancing' );
        this.advance ( );
        //console.log ( 't', t );
        left = t.nud ( this );
        //console.log ( 'left', left );
        while ( rbp < this.get_token ( ).lbp ) {
          t = this.get_token ( );
          //console.log ( 't', t );
          this.advance ( );
          left = t.led ( this, left );
          //console.log ( 'left', left );
          }
        //console.log ( 'exited on token', this.get_token ( ) );
        return left;
        },
      };
    return function ( text ) {
      return obj_or ( Object.create ( root_parser ), {
        tokens: [],
        text: text || "",
        token_idx: 0,
        text_idx: 0,
        scope: scope ( ),
        } );
      };
    } ( );

  var parser = make_parser ( scope ( ) );
  //var parser = {
    //textTables: [
      //],
    //exprTextTable: {
      //'+': infix ( 60 ),
      //'-': obj_or ( infix ( 60 ), prefix ( 80 ) ),
      //'++': prefix ( 90 ),
      //'if': keyword,
      //'while': keyword,
      //},
    //typeTables: [
      //],
    //exprTypeTable: {
      //'number' : atom,
      //'identifier': atom,
      //'space': null,
      //},
    //textTablePush: function ( table ) {
      //this.textTables.push ( table );
      //},
    //typeTablePush: function ( table ) {
      //this.typeTables.push ( table );
      //},
    //textTableGet: function ( key ) {
      //return tableStackGet ( this.textTables, key );
      //},
    //typeTableGet: function ( key ) {
      //return tableStackGet ( this.typeTables, key );
      //},
    //textTableSetNew: function ( key, val ) {
      //tableStackSetNew ( this.textTables, key, val );
      //},
    //typeTableSetNew: function ( key, val ) {
      //tableStackSetNew ( this.typeTables, key, val );
      //},
    //splitOp: function ( token ) {
      //var i = token.text.length;
      //while ( this.textTableGet ( token.text.substr ( 0, i ) ) === undefined ) {
          //i -= 1;
          //}
      //if ( i === 0 ) {
          //throw 'Could not identify operator ' + token.text;
          //}
      //if ( i === token.text.length ) {
          //return [token];
          //}
      //else {
          //return [obj_or ( token, {text: token.text.substr ( 0, i )} )].concat (
                  //this.splitOp ( obj_or ( token, {text: token.text.substr ( i )} ) ) );
          //}
      //},
    //moreTokens: function ( count ) {
      //while ( count > 0 ) {
        //var token = lex ( this.text.substr ( this.text_idx ) );
        //if ( token ) {
          //this.text_idx += token.text.length;
          //if ( token.type === 'operator' ) {
            //this.tokens.concat ( this.splitOp ( token ) );
            //}
          //else {
            //this.tokens.push ( token );
            //}
          //}
        //count -= 1;
        //}
      //},
    //nextToken: function ( ) {
      //if ( this.tokens.length === this.idx ) {
        //this.moreTokens ( 1 )
        //}
      //this.current = this.tokens[this.idx];
      //this.idx += 1;
      //},
    //peekToken: function ( idx ) {
      //var count;
      //idx = idx || 0;
      //count = 1 + idx + this.idx - this.tokens.length;
      //if ( count > 0 ) {
        //this.moreTokens ( count );
        //}
      //return this.tokens[this.idx + idx];
      //},
    //loadCurrentFromTable: function ( ) {
      //var toClone;
      //if ( !this.current ) {
        //this.current = {text: ' ( end )', type: ' ( special )', lbp: 0};
        //return;
        //}
      //toClone = this.textTableGet ( this.current.text );
      //if ( toClone !== undefined ) {
        //this.current = obj_or ( Object.create ( toClone ), this.current );
        //}
      //else {
        //toClone = this.typeTableGet ( this.current.type );
        //if ( toClone === null ) {
          //this.advance ( );
          //}
        //else if ( toClone === undefined ){
          //throw new Error ( 'Unknown token: ' + this.current.text );
          //}
        //else {
          //this.current = obj_or ( Object.create ( toClone ), this.current );
          //}
        //}
      //},
    //advance: function ( ) {
      //this.nextToken ( );
      //console.log ( this.tokens );
      //this.loadCurrentFromTable ( );
      //},
    //expr: function ( rbp ) {
      //var left;
      //var t = this.current;
      //if ( rbp === undefined ) {
        //rbp = 0;
        //}
      //this.advance ( );
      //left = t.nud ( this );
      //while ( rbp < this.current.lbp ) {
        //t = this.current;
        //this.advance ( );
        //left = t.led ( this, left );
        //}
      //return left;
      //},
    //parse_expr: function ( text ) {
      //this.typeTablePush ( this.exprTypeTable );
      //this.textTablePush ( this.exprTextTable );
      //this.idx = 0;
      //this.tokens = lexAll ( text );
      ////this.tokens = [];
      //this.moreTokens ( 3 );
      //this.advance ( );
      //return this.expr ( 0 )
      //}
  //};

  //function make_parser ( text ) {
    //return obj_or ( Object.create ( parser ), {
      //idx: 0,
      //tokens: [],
      //current: null,
      //text_idx: 0,
      //text: text || "",
      //text_exhausted: true,
      //} );
    //};

  //function parse_expr ( text ) {
    //return make_parser ( ).parse_expr ( text )
    //}

  console.log ( util.inspect ( make_parser ( '++apple + -1 - - bad' ).expr ( ), { colors: true, depth: 100 } ) );
  };
main ( xregexp );
