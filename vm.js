var util = require ( 'util' );

var main = function ( ) {

  var ops = {
    'noop': 0,
    'add': 1,
    'li': 2,
    'print': 3,
    'end': 4
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
    make_bunch ( ops.li, ops.li, ops.li, ops.add ),
    5,
    6,
    -2,
    make_bunch ( ops.add, ops.print ),
    make_bunch ( ops.end )
    ];

  var op_args = [ 0, 0, 0, 0 ];

  function shift_bunch ( bunch, amount ) {
    for ( var i = 0; i < amount; i++ ) {
      var removed = bunch.shift ();
      bunch[3] = 0;
      }
    }

  var op_table = [
    function noop ( state ) {
      state.bunch = state.func[state.get_pc ( ) ];
      state.move_pc ( 1 );
      },
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
      },
    function end ( state ) {
      state.run = false;
      }
    ];

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
          shift_bunch ( this.bunch, 1 + op_args[op] );
          op_table[op] ( this );
          }
        }
      };
    }

    var vm = make_vm ( code );
    vm.run ( );
  };
main ( );
