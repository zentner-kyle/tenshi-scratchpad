var util = require ( 'util' );

var main = function ( ) {

  function make_optables ( ops ) {
    var out = {
      op: {},
      code: {},
      name: [],
      argc: [],
      func: [],
      };
    for ( var i in ops ) {
      out.op[ops[i].name] = ops[i];
      out.code[ops[i].name] = ops[i].code;
      out.argc[ops[i].code] = ops[i].argc;
      out.func[ops[i].code] = ops[i].func;
      out.name[ops[i].code] = ops[i].name;
      }
    return out;
    };

  function make_opcode ( code, name, argc, func ) {
    return {
      code: code,
      name: name,
      argc: argc,
      func: func,
      };
    };

  var opcodes = [
    make_opcode ( 0, 'noop', 0,
    function noop ( state ) {
      state.bunch = state.func[state.get_pc ( ) ].slice ( 0 );
      state.move_pc ( 1 );
      }),
    make_opcode ( 1, 'add', 1,
    function add ( state ) {
      state.push ( state.pop ( ) + state.pop ( ) );
      }),
    make_opcode ( 2, 'li', 1,
    function li ( state ) {
      state.push ( state.func[ state.get_pc ( ) ] );
      state.move_pc ( 1 );
      }),
    make_opcode ( 3, 'print', 1,
    function print ( state ) {
      for ( var i = 0; i < state.stack_top; i++ ) {
        console.log ( state.stack[i] );
        }
      }),
    make_opcode ( 4, 'end', 1,
    function end ( state ) {
      state.run = false;
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
  var code = [
    make_bunch ( ops.li, ops.li, ops.li, ops.add ),
    5,
    6,
    -2,
    make_bunch ( ops.add, ops.print ),
    make_bunch ( ops.end )
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
      stack: [],
      bunch: [0, 0, 0, 0],
      push: function ( val ) {
        this.stack[this.stack_top] = val;
        this.stack_top += 1;
        },
      get_pc: function ( ) {
        return this._pc;
        },
      move_pc: function ( amount ) {
        this._pc += amount;
        },
      pop: function ( ) {
        this.stack_top -= 1;
        var out = this.stack[this.stack_top];
        return out;
        },
      run: function ( ) {
        while ( this.run ) {
          var op = this.bunch[0];
          /// Uncomment this line for debugging
          // console.log ( this );
          tables.func[op] ( this );
          shift_bunch ( this.bunch, tables.argc[op] );
          }
        }
      };
    }

  var vm = make_vm ( code );
  vm.run ( );
  };
main ( );
