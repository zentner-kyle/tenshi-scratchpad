var requirejs = require ('./r.js/r.js');

requirejs.config ({
  nodeRequire: require
  });

requirejs (['./xregexp/xregexp-all.js'],
function (xregexp) {

  var lex = function () {
    var token_reg = xregexp ( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<lparen>      \\()                                |' +
        ' (?<rparen>      \\))                                |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}\\(\\)]+)  '
        , 'x' );
    return function (text) {
      return xregexp.exec (text, token_reg);
      }
    } ();

  function getType (match) {
    var types = ['space', 'number', 'identifier', 'operator', 'lparen', 'rparen'];
    for (var t in types) {
      if (match[types[t]] !== undefined) {
        return types[t];
        }
      }
    throw new Error ('Could not determine type of match "' + match[0] + '"');
    };

  function main () {
    };
  main ();
  });
