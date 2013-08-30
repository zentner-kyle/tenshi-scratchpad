var requirejs = require('./r.js/r.js');

requirejs.config({
  nodeRequire: require
  });

requirejs(['./xregexp/xregexp-all.js'],
function (xregexp) {
  function match_all (text, regex, callback) {
    xregexp.forEach(text, regex, callback)
    }
  var parser_state = {
    prefix: 1,
    infix:  2,
    line_start: 3,
    };

  function Token (type, text) {
    this.type = type
    this.text = text
    }

  function Operator (type, text, lbp, rbp, starts_indent) {
    this.type = type;
    this.text = text;
    this.lbp  = lbp;
    this.rbp  = rbp;
    this.starts_indent = starts_indent;
    }

  function fill_operator_table (operator_table) {
    // The following was basically copied from Wick
    var infix_table = [
        [ "="    ,  5 ,  4 ,  true ] , 
        [ "<-"   , 10 ,  9 ,  true ] , 
        [ "->"   , 10 ,  9 ,  true ] , 
        [ ":"    , 15 , 14 ,  true ] , 
        [ "\\"   , 10 , 10 , false ] , 
        [ "\\\\" , 10 , 10 , false ] , 
        [ "++"   , 60 , 60 , false ] , 
        [ "<+>"  , 60 , 60 , false ] , 
        [ "--"   , 60 , 60 , false ] , 
        [ "<->"  , 60 , 60 , false ] , 
        [ "**"   , 70 , 69 , false ] , 
        [ "<*>"  , 70 , 70 , false ] , 
        [ "/"    , 70 , 70 , false ] , 
        [ "//"   , 70 , 70 , false ] , 
        [ "</>"  , 70 , 70 , false ] , 
        [ "%"    , 70 , 70 , false ] , 
        [ "%%"   , 70 , 70 , false ] , 
        [ "<%>"  , 70 , 70 , false ] , 
        [ "<<"   , 60 , 60 , false ] , 
        [ ">>"   , 60 , 60 , false ] , 
        [ "<<<"  , 60 , 60 , false ] , 
        [ ">>>"  , 60 , 60 , false ] , 
        [ "<"    , 50 , 50 , false ] , 
        [ ">"    , 50 , 50 , false ] , 
        [ ">="   , 50 , 50 , false ] , 
        [ "<="   , 50 , 50 , false ] , 
        [ "=>"   , 50 , 50 , false ] , 
        [ "=="   , 50 , 50 , false ] , 
        [ "!="   , 50 , 50 , false ] , 
        [ "and"  , 30 , 30 , false ] , 
        [ "or"   , 30 , 30 , false ] , 
        [ "."    , 90 , 90 , false ] , 
        [ "::"   , 20 , 20 , false ] , 
        [ ".."   , 60 , 60 , false ] , 
        [ "*"    , 70 , 70 , false ] , 
        [ "+"    , 60 , 60 , false ] , 
        [ "-"    , 60 , 60 , false ] , 
        [ "!"    , 40 , 40 , false ] , 
        [ "!!"   , 40 , 40 , false ] , 
        [ "@"    , 20 , 20 , false ] , 
        [ "^"    , 40 , 40 , false ] , 
        [ "&"    , 40 , 40 , false ] , 
        [ "|"    , 40 , 40 , false ] , 
        [ "~"    , 40 , 40 , false ] , 
        [ "$"    , 20 , 20 , false ] , 
      ];

    var prefix_table = [
        [ "+"    , 60 ] , 
        [ "-"    , 60 ] , 
        [ "*"    , 70 ] , 
        [ "!"    , 40 ] , 
        [ "!!"   , 40 ] , 
        [ "\\"   , 10 ] , 
        [ "\\\\" , 10 ] , 
        [ "@"    , 20 ] , 
        [ "^"    , 40 ] , 
        [ "&"    , 40 ] , 
        [ "|"    , 40 ] , 
        [ "~"    , 40 ] , 
        [ ".."   , 60 ] , 
        [ "$"    , 20 ] , 
      ];

    for (var i in infix_table) {
      var inf = infix_table[i];
      operator_table[inf[0]] = [new Operator('infix', inf[0], inf[1], inf[2], inf[3])];
      }

    for (var i in prefix_table) {
      var pre = prefix_table[i];
      var op = new Operator('prefix', pre[0], 0, pre[1], false);
      if (operator_table[pre[0]]) {
        operator_table[pre[0]].push(op)
        }
      else {
        operator_table[pre[0]] = [op];
        }
      }
    }

  function process_match (match, operator_table, callback) {
    if (match.space) {
      callback(new Token('space', match.space));
      }
    else if (match.number) {
      callback(new Token('number', match.number));
      }
    else if (match.identifier) {
      callback(new Token('identifier', match.identifier));
      }
    else if (match.operator) {
      var ops = split_op(match.operator, operator_table);
      for (var i in ops) {
        callback(new Token('operator', ops[i]))
        }
      }
    }

  function split_op(text, operator_table) {
    var i = text.length;
    while (!(text.substr(0, i) in operator_table)) {
      i--;
      }
    if (i == 0) {
      return []
      }
    if (i == text.length) {
      return [text]
      }
    else {
      return [text.substr(0, i)].concat(split_op(text.substr(i), operator_table))
      }
    }

  function new_operator_table () {
    var operator_table = {};
    fill_operator_table(operator_table);
    return operator_table;
    }

  function parse (text) {
    var operator_table = new_operator_table ();
    }

  function lex (text, callback) {
    var token_reg = xregexp( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
    match_all (text, token_reg, function (match) {
      process_match (match, new_operator_table(), callback);
      });
    }

  function main () {
    var test_text = ' test =--test - 40';
    lex (test_text, console.log);
    };
  main ();
  });

