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


var make = function make ( obj ) {
  var storage = {};

  if ( obj !== undefined ) {
    for ( var k in obj ) {
      storage[k + '$'] = obj[k];
      }
    }
  return {
    'get': function ( key, alternative ) {
      var val = storage[key + '$'];
      if ( val === undefined ) {
        this.set ( key, alternative );
        }
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
  };

export_val ( 'make', make );
