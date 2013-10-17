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

var scope = require ( './scope.js' );
var string_map = require ( './string_map.js' );
var parse = require ( './parse.js' );
var compile = require ( './compile.js' );
var execute = require ( './execute.js' );
var type = require ( './type.js' );
var misc = require ( './misc.js' );

function compile_and_run ( text ) {
  var scopes = string_map.make ( );
  var parser = parse.make ( );
  var compiler = compile.make ( );
  var executor = execute.make ( );
  var typer = type.make ( );
  var parse_tree;
  var bytecode;

  parser.setupScopes ( scopes );
  compiler.setupScopes ( scopes );
  typer.setupScopes ( scopes );

  parse_tree = parser.parse ( text );
  misc.print ( parse_tree );

  typer.type ( parse_tree );

  bytecode = compiler.compile ( parse_tree );
  misc.print ( 'bytecode =', bytecode );

  executor.execute ( bytecode );
  }

compile_and_run ( 'test = 1 + 2' );

var to_parse = '' +
'n = 100\n' +
'a = 1\n' +
'b = 1\n' +
'while n != 0:\n' +
'    temp = a + b\n' +
'    a = b\n' +
'    b = temp\n' +
'    n = n - 1\n';
