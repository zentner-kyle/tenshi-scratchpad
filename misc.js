var require = require;
var console = console;
var export_val;
var exported_symbols = [];
if ( require === undefined ) {
  export_val = function ( name, val ) {
    exported_symbols.push ( name );
    };
  console = (components.utils.import("resource://gre/modules/devtools/console.jsm", {})).console;
  require = function ( filename ) {
    return components.utils.import("chrome://angel-player/content/angelic/" + filename);
    };
  }
else {
  export_val = function ( name, val ) {
    exports[name] = val;
    };
  console = require ( 'console' );
  }

var obj_or = function obj_or ( obja, objb ) {
  var k;
  for ( k in objb ) {
    obja[k] = objb[k];
    }
  return obja;
  };

var print = function print () {
  return console.log.apply ( console, arguments );
  }

export_val ( 'obj_or', obj_or );
export_val ( 'print', print );
