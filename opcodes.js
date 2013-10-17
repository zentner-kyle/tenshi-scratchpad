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

var main = function main ( ) {

  var misc = require ( './misc.js' );

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
        misc.print ( state.stack[i] );
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

  var tables = make_optables ( opcodes );

  export_val ( 'opcodes', opcodes );
  export_val ( 'op', tables.op );
  export_val ( 'code_to_obj', tables.code_to_obj );
  export_val ( 'code', tables.code );
  export_val ( 'argc', tables.argc );
  export_val ( 'func', tables.func );
  export_val ( 'name', tables.name );
  export_val ( 'tables', tables );
  };

main ( );
