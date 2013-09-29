var util = require ( 'util' );

var main = function ( ) {

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

  function make_opcode ( code, name, argc, stack, func ) {
    return {
      code: code,
      name: name,
      argc: argc,
      stack: stack,
      func: func,
      };
    };

  var opcodes = [
    make_opcode ( 0, 'noop', 0, 0,
    function noop ( state ) {
      state.check_bunch ( state.func[state.get_pc ( )] );
      state.bunch = state.func[state.get_pc ( ) ].slice ( 0 );
      state.move_pc ( 1 );
      }),
    make_opcode ( 1, 'add', 1, -1,
    function add ( state ) {
      state.push ( state.pop ( ) + state.pop ( ) );
      }),
    make_opcode ( 2, 'li', 1, 1,
    function li ( state ) {
      state.push ( state.func[ state.get_pc ( ) ] );
      state.move_pc ( 1 );
      }),
    make_opcode ( 3, 'print', 1, 0,
    function print ( state ) {
      for ( var i = 0; i < state.stack_top; i++ ) {
        console.log ( state.stack[i] );
        }
      }),
    make_opcode ( 4, 'end', 1, 0,
    function end ( state ) {
      state.run = false;
      }),
    make_opcode ( 5, 'mult', 1, -1,
    function add ( state ) {
      state.push ( state.pop ( ) * state.pop ( ) );
      }),
    make_opcode ( 6, 'div', 1, -1,
    function add ( state ) {
      state.push ( state.pop ( ) / state.pop ( ) );
      }),
    make_opcode ( 7, 'bn1', 2, -1,
    function bn1 ( state ) {
      if ( ! state.pop ( ) ) {
        state.move_pc ( state.get_arg ( 1 ) );
        }
      }),
    make_opcode ( 8, 'eq', 1, -1,
    function eq ( state ) {
      state.push ( state.pop ( ) === state.pop ( ) );
      }),
    make_opcode ( 9, 'dup', 2, 1,
      function dup ( state ) {
      state.push ( state.get_stack ( state.get_arg ( 1 ) ) );
      }),
    make_opcode ( 10, 'set', 2, -1,
      function set ( state ) {
      state.set_stack ( state.get_arg ( 1 ), state.pop ( ) );
      }),
    make_opcode ( 11, 'not', 1, 0,
    function not ( state ) {
      state.push ( ! state.pop ( ) );
      }),
    make_opcode ( 12, 'j1', 2, 0,
    function j1 ( state ) {
      state.move_pc ( state.get_arg ( 1 ) );
      }),
    make_opcode ( 13, 'pop', 1, -1,
    function pop ( state ) {
      state.pop ( );
      }),
    ];

  var tables = make_optables ( opcodes );

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

  function make_assignment ( name, val ) {
    return {
    text: '=',
    left: name,
    right: val,
    compile: compile_assignment
      };
    }

  function make_number ( val ) {
    return {
    text: val,
    compile: compile_number
      }
    }

  function make_var ( name ) {
    return {
    text: name,
      compile: function compile_var ( cgen ) {
        cgen.emit ( ops.dup, cgen.var_idx ( this.text ) );
        cgen.add_temp ( 1 );
        }
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

  function make_add ( left, right ) {
    return {
    left: left,
    right: right,
    compile: compile_add
      };
    }

  var ast = {
    type: 'block',
    compile: compile_block,
    children: [
      make_assignment ( make_var ( 'n' ), make_number ( 100 ) ),
      make_assignment ( make_var ( 'a' ), make_number ( 1 ) ),
      make_assignment ( make_var ( 'b' ), make_number ( 1 ) ),
      { type: 'while',
        condition: {
            text: '!=',
              left: make_var ( 'n' ),
              right: make_number ( 0 ),
              compile: compile_not_equal
          },
        children: [
          make_assignment ( make_var ( 'temp' ), make_add ( make_var ( 'a' ), make_var ( 'b' ) ) ),
          make_assignment ( make_var ( 'a' ), make_var ( 'b' ) ),
          make_assignment ( make_var ( 'b' ), make_var ( 'temp' ) ),
          make_assignment ( make_var ( 'n' ), make_add ( make_var ( 'n' ), make_number ( -1 ) ) ),
          ],
          compile: compile_while
        },
      {
      compile: function compile_print ( cgen ) {
        cgen.emit ( ops.print );
        }
        },
      {
      compile: function compile_end ( cgen ) {
        cgen.emit ( ops.end );
        }
        }
     ]};

  ast.compile ( cgen );
  console.log ( cgen.code );

  // Calculate fib(102)

  /*
   * n = 100
   * a = 1
   * b = 1
   * while n != 0:
   *  temp = a + b
   *  a = b
   *  b = temp
   *  n = n - 1
   *
   * li 100
   * # [100]
   * li 1
   * # [100, 1]
   * li 1
   * # [100, 1, 1]
   *
   * loop_start:
   * dup 2
   * # [100, 1, 1, 100]
   * li 0
   * # [100, 1, 1, 100, 0]
   * eq
   * # [100, 1, 1, false]
   * not
   * # [100, 1, 1, true]
   * bn1 the_end
   * # [100, 1, 1]
   *
   * dup 1
   * # [100, 1, 1, 1], [99, 1, 2, 1]
   * dup 1
   * # [100, 1, 1, 1, 1], [99, 1, 2, 1, 2]
   * add
   * # [100, 1, 1, 2], [99, 1, 2, 3]
   * dup 1
   * # [100, 1, 1, 2, 1], [99, 1, 2, 3, 2]
   * set 3
   * # [100, 1, 1, 2], [99, 2, 2, 3]
   * set 1
   * # [100, 1, 2], [99, 2, 3]
   *
   * dup 2
   * # [100, 1, 2, 100]
   * li -1
   * # [100, 1, 2, 100, -1]
   * add
   * # [100, 1, 2, 99]
   * set 3
   * # [99, 1, 2]
   *
   * j loop_start
   * the_end
   */

  var code = [
    make_bunch ( ops.li, ops.li, ops.li ),
    100,
    1,
    1,
    make_bunch ( ops.dup, 2, ops.li ),
    0,
    make_bunch ( ops.eq, ops.not, ops.bn1, 7 ),
    make_bunch ( ops.dup, 1, ops.dup, 1 ),
    make_bunch ( ops.add, ops.dup, 1 ),
    make_bunch ( ops.set, 3, ops.set, 1 ),
    make_bunch ( ops.dup, 2, ops.li ),
    -1,
    make_bunch ( ops.add, ops.set, 3 ),
    make_bunch ( ops.j1, -10 ),
    make_bunch ( ops.set, 1, ops.set, 1 ),
    make_bunch ( ops.print, ops.end )
    ];

  function shift_bunch ( bunch, amount ) {
    for ( var i = 0; i < amount; i++ ) {
      var removed = bunch.shift ();
      bunch[3] = 0;
      }
    }

  function make_vm ( func ) {
    return {
      func: func,
      stack_top: 0,
      frame: 0,
      _pc: 0,
      run: true,
      debug: false,
      stack: [],
      bunch: [0, 0, 0, 0],
      push: function ( val ) {
        this.stack[this.stack_top] = val;
        this.stack_top += 1;
        },
      get_pc: function ( ) {
        return this._pc;
        },
      get_arg: function ( idx ) {
        return this.bunch [ idx ];
        },
      move_pc: function ( amount ) {
        this._pc += amount;
        },
      pop: function ( ) {
        this.stack_top -= 1;
        var out = this.stack[this.stack_top];
        this.stack = this.stack.slice (0, this.stack_top);
        return out;
        },
      get_stack: function get_stack ( index ) {
        return this.stack[this.stack_top - index - 1];
        },
      set_stack: function set_stack ( index, val ) {
        this.stack[this.stack_top - index] = val;
        },
      check_bunch: function ( bunch ) {
        if ( bunch === undefined ) {
          console.log ( 'Invalid opcode bunch:', bunch );
          }
        },
      debug_print: function ( ) {
        var op = this.bunch[0];
        if ( op === 0 ) {
          return;
          }
        console.log ( this.stack );
        var args = ' ';
        for ( var i = 1; i < tables.argc[op]; i++) {
          args += this.get_arg ( i ) + ' ';
          }
        console.log ( tables.name[op] + args );
        },
      run: function ( ) {
        while ( this.run ) {
          var op = this.bunch[0];
          if ( this.debug ) {
            this.debug_print ( );
            }
          tables.func[op] ( this );
          shift_bunch ( this.bunch, tables.argc[op] );
          }
        }
      };
    }

  var vm = make_vm ( code );
  vm.debug = false;
  vm.run ( );

  vm = make_vm ( cgen.code );
  vm.debug = false;
  vm.run ( );
  };
main ( );
