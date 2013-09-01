var requirejs = require ('./r.js/r.js');

requirejs.config ({
  nodeRequire: require
  });

requirejs (['./xregexp/xregexp-all.js'],
function (xregexp) {
  var lex = function () {
    var token_reg = xregexp ( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
    return function (text) {
      return xregexp.exec (text, token_reg);
      }
    } ();
  var symbol_table = {};

  var original_symbol = {
    nud: function () {
      this.error ("Undefined.");
      },
    led: function (left) {
      this.error ("Missing operator.");
      }
    };

  var expression = function (rbp) {
    };


  });
