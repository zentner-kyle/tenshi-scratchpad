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
  var opcodes = require( './opcodes.js' );
  var tables = opcodes.tables;
  var shift_bunch = function shift_bunch ( bunch, amount ) {
    for ( var i = 0; i < amount; i++ ) {
      var removed = bunch.shift ( );
      bunch[3] = 0;
      }
    }


  function make ( ) {
    return {
      func: [],
      stack_top: 0,
      frame: 0,
      _pc: 0,
      run: true,
      debug: false,
      stack: [],
      bunch: [0, 0, 0, 0],
      execute: function ( func ) {
        this.func = func;
        this.run ( );
        },
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
    export_val ( 'make', make );
  };

main ( );

