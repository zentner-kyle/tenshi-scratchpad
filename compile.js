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

var main = function main () {
  var misc = require ( './misc.js' );
  var opcodes = require ( './opcodes.js' );
  var string_map = require ( './string_map.js' );
  function make_optables ( ops ) {
    var out = {
      op: {},
      code_to_obj: [],
      code: {},
      name: [],
      argc: [],
      func: [],
      };
    for ( var i in ops ) {
      out.op[ops[i].name] = ops[i];
      out.code_to_obj[ops[i].code] = ops[i];
      out.code[ops[i].name] = ops[i].code;
      out.argc[ops[i].code] = ops[i].argc;
      out.func[ops[i].code] = ops[i].func;
      out.name[ops[i].code] = ops[i].name;
      }
    return out;
    };

  var tables = make_optables ( opcodes.opcodes );

  function make_bunch ( a, b, c, d ) {
    if ( a === undefined ) {
      a = 0;
      }
    if ( b === undefined ) {
      b = 0;
      }
    if ( c === undefined ) {
      c = 0;
      }
    if ( d === undefined ) {
      d = 0;
      }
    return [a, b, c, d];
    }

  var ops = tables.code;

  function assert ( thing, reason ) {
    if ( ! thing ) {
      console.log ( 'ERROR: ' + reason );
      }
    }

  var cgen = {
    code: [],
    tempc: 0,
    vars: [],
    emit: function ( a, b, c, d ) {
      this.emit_bunch ( make_bunch ( a, b, c, d ) );
      },
    emit_bunch: function ( bunch ) {
      this.code.push ( bunch );
      },
    add_temp: function ( count ) {
      this.tempc += count;
      },
    has_var: function has_var ( name ) {
      return this.vars.lastIndexOf ( name ) !== -1;
      },
    var_idx: function var_idx ( name ) {
      var index = this.vars.lastIndexOf( name );
      var out = this.vars.length - index - 1 + this.tempc;
      return out;
      },
    add_var: function add_var ( name ) {
      assert ( this.tempc === 1, "There should be precisely one temporary when a variable is added." );
      this.vars.push ( name );
      },
    get_pc: function get_pc ( ) {
      return this.code.length - 1;
      },
    set: function set ( idx, val ) {
      assert ( this.code[idx] === 'reserved', 'Only reserved code should be overwritten' );
      this.code[idx] = val;
      },
    reserve_bunch: function ( ) {
      this.code.push ( 'reserved' );
      return this.get_pc ( );
      },
    get_scope_snapshot: function ( ) {
      assert ( this.tempc === 0, "There should be no temporary values at a scope snapshot." );
      return this.vars.slice ( 0 );
      },
    apply_scope_snapshot: function ( snapshot ) {
      assert ( this.tempc === 0, "There should be no temporary values at a scope snapshot." );
      assert ( snapshot.length <= this.vars.length, "Applied snapshot should have at most same number of vars." );
      var extra_now = false;
      for ( var i in this.vars ) {
        if ( ! extra_now && snapshot[i] === undefined ) {
          extra_now = true;
          }
        if ( ! extra_now ) {
          assert ( snapshot[i] === this.vars[i], "Snapshot should have same prefix as current scope." );
          }
        else {
          assert ( snapshot[i] === undefined, "There should be no more vars after the current scope ends." );
          this.emit ( ops.pop );
          }
        }
      this.vars = snapshot;
      },
    };

  function compile_assignment ( cgen ) {
     if ( cgen.has_var ( this.left.text ) ) {
       this.right.compile ( cgen );
       cgen.emit ( ops.set, cgen.var_idx ( this.left.text ) );
       cgen.add_temp ( -1 );
       }
     else {
       assert ( cgen.tempc === 0, "There should be no temporaries when a variable is created." );
       this.right.compile ( cgen );
       cgen.add_var ( this.left.text );
       cgen.add_temp ( -1 );
       }
    }

  function compile_number ( cgen ) {
      cgen.emit ( ops.li );
      cgen.emit_bunch ( parseInt ( this.text ) )
      cgen.add_temp ( 1 );
    }

  function compile_block ( cgen ) {
    for ( var c in this.children ) {
      this.children[c].compile ( cgen )
      }
    }

  function compile_not_equal ( cgen ) {
    this.left.compile ( cgen );
    this.right.compile ( cgen );
    cgen.emit ( ops.eq, ops.not );
    cgen.add_temp ( -1 );
    }

  function compile_while ( cgen ) {
    var start = cgen.get_pc ( );
    this.condition.compile ( cgen );
    var branch = cgen.reserve_bunch ( );
    cgen.add_temp ( -1 );
    var scope_snapshot = cgen.get_scope_snapshot ( );
    for ( var c in this.children ) {
      this.children[c].compile ( cgen );
      }
    cgen.apply_scope_snapshot ( scope_snapshot );
    cgen.emit ( ops.j1, start - cgen.get_pc ( ) - 1 );
    cgen.emit ( ops.noop );
    cgen.set ( branch, make_bunch ( ops.bn1, cgen.get_pc ( ) - branch ) );
    }

  function compile_add ( cgen ) {
    this.left.compile ( cgen );
    this.right.compile ( cgen );
    cgen.emit ( ops.add );
    cgen.add_temp ( -1 );
    }

  function compile_sub ( cgen ) {
    this.left.compile ( cgen );
    this.right.compile ( cgen );
    cgen.emit ( ops.add );
    cgen.add_temp ( -1 );
    }


  function compile_identifier ( cgen ) {
    cgen.emit ( ops.dup, cgen.var_idx ( this.text ) );
    cgen.add_temp ( 1 );
    }

  var root = {
    setupScopes: function setupScopes ( scopes ) {
      var statement_text_table = string_map.make ( {
        'block': compile_block,
        '=': compile_assignment,
        'while': compile_while,
        } );
      statement_text_table.each ( function ( key, val ) {
        scopes.get ( 'statement' ).field_text ( key, 'compile', val );
        } );
      var statement_type_table = string_map.make ( {
        } );
      statement_type_table.each ( function ( key, val ) {
        scopes.get ( 'statement' ).field_type ( key, 'compile', val );
        } );
      var expression_type_table = string_map.make ( {
        'number': compile_number,
        'identifier':  compile_identifier,
        } );
      expression_type_table.each ( function ( key, val ) {
        scopes.get ( 'expression' ).field_type ( key, 'compile', val );
        } );
      var expression_text_table = string_map.make ( {
        '!=': compile_not_equal,
        '+': compile_add,
        '-': compile_sub,
        } );
      expression_text_table.each ( function ( key, val ) {
        scopes.get ( 'expression' ).field_text ( key, 'compile', val );
        } );
      },
    compile: function compile ( ast ) {
      ast.compile ( cgen );
      return cgen.code;
      },
    };

  var make = function make ( ) {
    return Object.create ( root );
    };
  export_val ( 'make', make );
  };

main();
