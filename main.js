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

  function getType (match) {
    var types = ['space', 'number', 'identifier', 'operator'];
    for (var t in types) {
      if (match[types[t]] !== undefined) {
        return types[t];
        }
      }
    throw new Error ('Could not determine type of match "' + match[0] + '"');
    };

  function make_special (name) {
    return {
      type: 'special',
      text: name,
      };
    };

  function make_parser (states, startState) {
    var text = "";
    var idx  = 0;
    var state = startState || "start";
    var tokenTable = {};
    var theStates = {};
    var accum = make_ast_node ('(root)');
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
        var match = self.getState ().lex (text.substr (idx));
        if (match === null) {
          return make_special ('(end)');
          }
        var type = getType (match);
        var tokenText = match[0];
        match = self.getState ().getToken (type, tokenText);
        if (match) {
          idx += match.text.length;
          }
        else {
          idx += tokenText.length;
          }
        if (match === undefined) {
          match = tokenTable[match];
          }
        if (match === undefined) {
          match = make_atom (tokenText, type);
          }
        return match;
        },
      start: function (some_text) {
        text = some_text;
        idx = 0;
        },
      parse: function () {
        var token;
        accum.push (make_special ('(start)'));
        while (true) {
          token = self.lexOnce ();
          if (token !== null) {
            accum.push (token);
            if (token.text === '(end)') {
              return accum;
              }
            }
          }
        },
      };
    return self;
    };

  function make_state (name) {
    var self = {
      table: {},
      name: name || "anonymous state",
      lex: lex,
      getToken: function (type, text) { 
        if (type === 'space') {
          return null;
          }
        if (type === 'operator') {
            return self.table[longest_prefix(text, self.table)];
          }
        return self.table[text];
        }
      };
    return self;
    };

  function make_pattern (text, matchers) {
    return {
      type: 'pattern',
      text: text,
      idx: 0,
      matchers: matchers || [],
      post: function (parser) {}
      };
    };

  function make_literal (token) {
    return {
      type: 'literal',
      arity: 'single',
      post: function (parser) {},
      token: token,
      };
    };

  function make_left (lbp) {
    return {
      type: 'left',
      arity: 'single',
      post: function (parser) {},
      power: lbp,
      };
    };

  function make_right (rbp, arity, next_state) {
    return {
      type: 'right',
      arity: arity | 'single',
      post: function (parser) {},
      power: rbp,
      };
    };

  function make_atom (text, type) {
    return {
      type: 'atom',
      subtype: type,
      text: text,
      };
    };

  function make_ast_node (name, children) {
    var self = {
      name: name || "(ast)",
      children: children || [],
      push: function (token) {
        self.children.push(token);
        },
      };
    return self;
    };

  function longest_prefix (text, table) {
    var i = text.length;
    while (!(text.substr (0, i) in table) && i > 0) {
      i -= 1;
      }
    if (i === 0) {
      return undefined;
      }
    else {
      return text.substr (0, i);
      }
    }

  function fill_prefix_table (table) {
    // The following was copied from Wick
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

    for (var i in prefix_table) {
      table[prefix_table[i][0]] = make_pattern(prefix_table[i][0], [
          make_literal (prefix_table[i][0]),
          make_right (prefix_table[i][2], 'single', 'prefix'),
          ]);
      }
    };

  function fill_infix_table (table) {
    // The following was copied from Wick
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

    for (var i in infix_table) {
      table[infix_table[i][0]] = make_pattern(infix_table[i][0], [
          make_left (infix_table[i][1]),
          make_literal (infix_table[i][0]),
          make_right (infix_table[i][2], 'single',
                      infix_table[i][3] ? 'indent' : 'prefix'),
          ]);
      }
    };

  function main () {
    var infix_state = make_state ('infix');
    var prefix_state = make_state ('prefix');
    var parser = make_parser ([infix_state, prefix_state], 'infix');
    fill_infix_table (infix_state.table);
    fill_prefix_table (prefix_state.table);
    parser.start ("a + 1");
    console.log(parser.parse ());
    };
  main ();
  });
