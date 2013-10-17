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

var hm = require('./hindleymilner.js');

var main = function main ( ) {
  function make ( )  {
    return {
      setupScopes: function ( scopes ) {
        },
      type: function ( ast ) {
	    //Call to hindleymilner.js to return a properly typed ast
		var new_ast = ast
		//var new_ast = hm.typecheck(ast);
        return new_ast;
        }
      }
    }
  export_val ( 'make', make );
  };

main ( );
