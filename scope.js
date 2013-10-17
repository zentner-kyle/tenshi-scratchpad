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
  var misc = require('./misc.js');
  var string_map = require ( './string_map.js' );

  var make = function ( ) {
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
      var text_table = string_map.make ( );
      var type_table = string_map.make ( );

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
            self.set_text ( key, misc.obj_or ( self.get_text ( key ) || Object.create(null), val ) );
            } );
          return this;
          },
        load_type: function ( table ) {
          var self = this;

          table.each ( function ( key, val ) {
            self.set_type ( key, misc.obj_or ( self.get_type ( key ) || Object.create(null), val ) );
            } );
          return this;
          },
        load: function ( other ) {
          var self = this;

          other.map_text ( function ( key, val ) {
            return misc.obj_or ( self.get_text ( key ), val );
            } );
          other.map_text ( function ( key, val ) {
            return misc.obj_or ( self.get_type ( key ), val );
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
          misc.print ( 'text' );
          this.map_text ( function ( key, val ) {
            misc.print ( key, val );
            return val;
            } );
          misc.print ( 'type' );
          this.map_type ( function ( key, val ) {
            misc.print ( key, val );
            return val;
            } );
          },
        toString: function ( ) {
          return text_table.toString ( ) + type_table.toString ( );
          }
        };
      }
    } ( );

  export_val ( 'make', make );
  };

main ();
