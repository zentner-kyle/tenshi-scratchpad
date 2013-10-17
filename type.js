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
  function make ( )  {
    return {
      setupScopes: function ( scopes ) {
        },
      type: function ( ast ) {
        return ast;
        }
      }
    }
  export_val ( 'make', make );
  };

main ( );
