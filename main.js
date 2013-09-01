var requirejs = require('./r.js/r.js');

requirejs.config({
  nodeRequire: require
  });

requirejs(['./xregexp/xregexp-all.js'],
function (xregexp) {

  var lex = function () {
    var token_reg = xregexp( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
    return function (text) {
      return xregexp.exec(text, token_reg);
      }
    } ()

  function getType (match) {
    var types = ['space', 'number', 'identifier', 'operator'];
    for (var t in types) {
      if (match[types[t]] !== undefined) {
        return types[t];
        }
      }
    throw new Error('Could not determine type of match "' + match[0] + '"');
    }

  function make_parser (states, startState) {
    var text = "";
    var idx  = 0;
    var state = startState || "start";
    var tokenTable = {};
    var theStates = {};
    for (var i in states) {
      theStates[states[i].name] = states[i];
      }
    var self = {
      getState: function () {
        return theStates[state];
        },
      changeState: function (stateName) {
        state = theStates[stateName];
        },
      lexOnce: function () {
        var match = self.getState().lex (text.substr(idx));
        var type = getType(match);
        var tokenText = match[0];
        idx += tokenText.length;
        match = self.getState ().getToken (type, tokenText);
        if (match === undefined) {
          match = tokenTable[match];
          }
        if (match === undefined) {
          match = make_atom(tokenText, type);
          }
        return match;
        },
      start: function (some_text) {
        text = some_text;
        idx = 0;
        },
      };
    return self;
    }

  function make_state (name) {
    var self = {
      table: {},
      name: name || "anonymous state",
      onMissing: function (toFind) {throw new Error("Could not find " + toFind);},
      lex: lex,
      getToken: function (type, text) { 
        if (type === 'space') {
          return null;
          }
        return self.table[text];
        }
      };
    return self;
    }

  function make_pattern (matchers) {
    return {
      matchers: matchers || [],
      post: function (parser) {}
      };
    }

  function make_unary_match (token) {
    return {
      type: 'literal',
      arity: 'single',
      post: function (parser) {},
      token: token,
      };
    }

  function make_left (lbp) {
    return {
      type: 'left',
      arity: 'single',
      post: function (parser) {},
      power: lbp,
      };
    }

  function make_right (rbp, arity) {
    return {
      type: 'right',
      arity: arity | 'single',
      post: function (parser) {},
      power: rbp,
      };
    }

  function make_atom (text, type) {
    return {
      type: 'atom',
      subtype: type,
      text: text,
      }
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
      return parser.table[match.identifier];
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


  function main () {
    var infix_state = make_state('infix');
    var parser = make_parser ([infix_state], 'infix');
    parser.start("a + 1");
    console.log(parser.lexOnce());
    console.log(parser.lexOnce());
    console.log(parser.lexOnce());
    console.log(parser.lexOnce());
    console.log(parser.lexOnce());
    };
  main ();
  });
