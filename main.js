var requirejs = require('./r.js/r.js');

requirejs.config({
  nodeRequire: require
  });

requirejs(['./xregexp/xregexp-all.js'],
function (xregexp) {
  function match_all (text, regex, callback) {
    xregexp.forEach(text, regex, callback);
    }
  var parser_state = {
    prefix: 1,
    infix:  2,
    line_start: 3,
    };

  function token (type, text) {
    return {
      type: type,
      text: text,
      }
    }

  function operator (type, text, lbp, rbp, starts_indent) {
    return {
      type: type,
      text: text,
      lbp: lbp,
      rbp: rbp,
      starts_indent: starts_indent,
      }
    }

  function state (name) {
    return {
      table: {},
      name: name || "anonymous state",
      onMissing: function (toFind) {throw new Error("Could not find " + toFind);},
      }
    }

  function pattern (matchers) {
    return {
      matchers: matchers || [],
      post: function (parser) {}
      }
    }

  function unary_match (token) {
    return {
      type: 'literal',
      arity: 'single',
      post: function (parser) {},
      token: token,
      }
    }

  function left (lbp) {
    return {
      type: 'left',
      arity: 'single',
      post: function (parser) {},
      power: lbp,
      }
    }

  function right (rbp, arity) {
    return {
      type: 'left',
      arity: arity | 'single',
      post: function (parser) {},
      power: rbp,
      }
    }

  function InvalidSyntax (message) {
    this.message = message;
    }

  function fill_operator_table (table) {
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
        [ "+"       , 60 ] , 
        [ "-"       , 60 ] , 
        [ "*"       , 70 ] , 
        [ "!"       , 40 ] , 
        [ "!!"      , 40 ] , 
        [ "\\"      , 10 ] , 
        [ "\\\\"    , 10 ] , 
        [ "@"       , 20 ] , 
        [ "^"       , 40 ] , 
        [ "&"       , 40 ] , 
        [ "|"       , 40 ] , 
        [ "~"       , 40 ] , 
        [ ".."      , 60 ] , 
        [ "$"       , 20 ] , 
        [ "if"      , 13 ] ,
        [ "for"     , 13 ] ,
        [ "import"  , 13 ] ,
        [ "while"   , 13 ] ,
        [ "var"     , 13 ] ,
        [ "assert"  , 13 ] ,
      ];

    for (var i in infix_table) {
      var inf = infix_table[i];
      table[inf[0]] = [operator('infix', inf[0], inf[1], inf[2], inf[3])];
      }

    for (var i in prefix_table) {
      var pre = prefix_table[i];
      var op = operator('prefix', pre[0], 0, pre[1], false);
      if (table[pre[0]]) {
        table[pre[0]].push(op);
        }
      else {
        table[pre[0]] = [op];
        }
      }
    }

  function select_op (parser, text) {
    if (parser.state === parser_state.infix) {
      var ops = parser.table[text];
      for (var i in ops) {
        if (ops[i].type === 'infix') {
          return ops[i];
          }
        }
      //throw text + ' appears in infix context, but is not an infix operator.';
      return ops[0];
      }
    else {
      var ops = parser.table[text];
      for (var i in ops) {
        if (ops[i].type === 'prefix') {
          return ops[i];
          }
        }
      //throw text + ' appears in prefix context, but is not a prefix operator.';
      return ops[0];
      }
    }

  function process_match (match, parser, callback) {
    if (match.space) {
      callback(token('space', match.space));
      }
    else if (match.number) {
      callback(token('number', match.number));
      }
    else if (match.identifier) {
      if (!(match.identifier in parser.table)) {
        parser.table[match.identifier] = token('identifier', match.identifier);
        }
      return parser.table[match.identifier]
      }
    else if (match.operator) {
      var ops = split_op(match.operator, parser.table);
      for (var i in ops) {
        callback(select_op(parser, ops[i]));
        }
      }
    }

  function split_op(text, table) {
    var i = text.length;
    while (!(text.substr(0, i) in table)) {
      i -= 1;
      }
    if (i === 0) {
      throw 'Could not identify operator ' + text;
      }
    if (i === text.length) {
      return [text];
      }
    else {
      return [text.substr(0, i)].concat(split_op(text.substr(i), table));
      }
    }

  function new_operator_table () {
    var table = {};
    fill_operator_table(table);
    return table;
    }

  function parse (text) {
    var table = new_operator_table ();
    }

  function Parser (text) {
    this.state = parser_state.line_start;
    this.table = new_operator_table ();
    this.idx = 0;
    this.text;
    }

  function lex (text, parser, callback) {
    var token_reg = xregexp( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
    match_all (text, token_reg, function (match) {
      process_match (match, parser, callback);
      });
    }

  function main () {
    var test_text = ' test =--test - 40';
    lex (test_text, new Parser(), console.log);
    };
  main ();
  });
