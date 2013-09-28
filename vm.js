var util = require ( 'util' );

var main = function ( ) {

  var ops = {
    'noop': 0,
    'add': 1,
    'li': 2,
    'print': 3
    };

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

  var code = [
    make_bunch ( ops.li, ops.li, ops.add ),
    5,
    6,
    make_bunch ( ops.print ),
    ];

  var op_args = [ 0, 0, 0, 0 ];

  function shift_bunch ( bunch, amount ) {
    for ( var i = 0; i < amount; i++ ) {
      var removed = bunch.shift ();
      bunch[3] = 0;
      }
    }

  var op_table = [
    function noop ( state ) {},
    function add ( state ) {
      state.push ( state.pop ( ) + state.pop ( ) );
      },
    function li ( state ) {
      state.push ( state.func[ state.get_pc ( ) ] );
      state.move_pc ( 1 );
      },
    function print ( state ) {
      for ( var i = 0; i < state.stack_top; i++ ) {
        console.log ( state.stack[i] );
        }
      }
    ];

  function make_vm ( func ) {
    var pc = 0;
    return {
      func: func,
      stack_top: 0,
      frame: 0,
      stack: [],
      bunch: [0, 0, 0, 0],
      push: function ( val ) {
        this.stack[this.stack_top] = val;
        this.stack_top += 1;
        },
      get_pc: function ( ) {
        return pc;
        },
      move_pc: function ( amount ) {
        pc += amount;
        },
      pop: function ( ) {
        this.stack_top -= 1;
        var out = this.stack[this.stack_top];
        return out;
        },
      run: function ( ) {
        while ( true ) {
          if ( this.bunch[0] === 0 ) {
            this.bunch = this.func[pc++];
            }
          if ( this.bunch === undefined ) {
            return 0;
            }
          var op = this.bunch[0];
          op_table[op] ( this );
          shift_bunch ( this.bunch, 1 + op_args[op] );
          }
        }
      }
    }

    var vm = make_vm ( code );
    vm.run ( );
  };
main ( );
