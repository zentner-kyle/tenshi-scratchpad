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

  function make_special (name, state) {
    var self = {
      text: name,
      state: state,
      post: function () {
        return [self.text];
        },
      };
    return self;
    };

  function make_parser (states, startState, postAtomState) {
    var text = "";
    var idx  = 0;
    var state = startState;
    var tokenTable = {};
    var theStates = {};
    var accum = make_pattern ('(root)', [make_right (0, state, 'multi')]);
    var root = accum;
    for (var i in states) {
      theStates[states[i].name] = states[i];
      }
    var self = {
      getState: function () {
        return theStates[state];
        },
      changeState: function (stateName) {
        if (stateName == state) {
          return;
          }
        // console.log ('Changing state to ' + stateName);
        if (theStates[stateName] === undefined) {
          throw new Error('Parser does not have state ' + stateName);
          }
        state = stateName;
        },
      lexOnce: function () {
        var match = self.getState ().lex (text.substr (idx));
        if (match === null) {
          return make_special ('(end)', startState);
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
          match = make_atom (tokenText, type, postAtomState);
          }
        if (match === undefined) {
          throw new Error ('Could not find token starting at ' + text.substr (idx));
          }
        return match;
        },
      start: function (some_text) {
        text = some_text;
        idx = 0;
        },
      parse: function () {
        var token;
        var matcher;
        accum.push (make_special ('(start)', startState));
        while (true) {
          token = self.lexOnce ();
          if (token !== null) {
            if (token.type === 'pattern') {
              matcher = token.getMatcher ();
              while (matcher && matcher.type === 'left') {
                while (token.lbp >= accum.rbp) {
                  accum = accum.parent;
                  }
                token.push (accum.pop);
                matcher = token.nextMatcher ();
                }
              if (matcher &&
                  matcher.type === 'literal' &&
                  matcher.text === token.text) {
                matcher = token.nextMatcher ();
                }
              if (matcher && matcher.type === 'right') {
                accum.push (token);
                accum = token;
                self.changeState (matcher.state);
                }
              //while (token.more ()) {
                //var m = token.getMatcher ();
                //if (m.type === 'left') {
                  //while (token.lbp >= accum.rbp) {
                    //accum = accum.parent;
                    //}
                  //var a = accum.pop ();
                  //token.push (a);
                  //}
                //else if (m.type === 'right') {
                  //accum.push (token);
                  //accum = token;
                  //self.changeState (m.state);
                  //break;
                  //}
                //else {
                  //throw new Error ('Unsupported matcher type ' + m.type);
                  //}
                //}
              }
            else {
              accum.push (token);
              console.log (accum)
              //self.changeState (accum.getMatcher ().state);
              self.changeState (token.state);
              if (!accum.more ()) {
                accum = accum.parent;
                }
              }
            if (token.text === '(end)') {
              return root.post ();
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
            return self.table[longest_prefix (text, self.table)];
          }
        return self.table[text];
        }
      };
    return self;
    };

  function make_pattern (text, matchers) {
    var self = {
      type: 'pattern',
      text: text,
      idx: 0,
      matchers: matchers || [],
      post: function (parser) {
        var out = [text];
        for (var m in self.matchers) {
          var res = self.matchers[m].post ();
            
          out.push (res);
          }
        return out;
        },
      push: function (match) {

        match.parent = self;
        self.matchers[self.idx].push (match);
        if (self.matchers[self.idx].arity === 'single') {
          self.idx += 1;
          }
        },
      pop: function () {
        var out = self.matchers[self.idx].pop ();
        return out;
        },
      more: function () {
        return self.idx < self.matchers.length;
        },
      getMatcher: function () {
        return self.matchers[self.idx];
        },
      nextMatcher: function () {
        self.advance ();
        return self.getMatcher ();
        },
      advance: function () {
        self.idx += 1;
        },
      };
    return self;
    };

  function make_literal (token) {
    var self = {
      type: 'literal',
      arity: 'single',
      pop: function () {
        return self.token.post ();
        },
      token: token,
      };
    return self;
    };

  function make_left (lbp) {
    var self = {
      type: 'left',
      arity: 'single',
      post: function (parser) {
        var out = [];
        var m;
        if (self.arity === 'single') {
          if (self.matches[0]) {
            return self.matches[0].post ();
            }
          }
        else {
          for (m in self.matches) {
            out.push (self.matches[m].post ());
            }
          return out;
          }
        },
      power: lbp,
      matches: [],
      push: function (val) {
        self.matches.push (val)
        },
      pop: function () {
        return self.matches.pop();
        },
      };
    return self;
    };

  function make_right (rbp, state, arity) {
    var self = {
      type: 'right',
      arity: arity || 'single',
      state: state,
      post: function (parser) {
        var out = [];
        var m;
        if (self.arity === 'single') {
          if (self.matches[0]) {
            return self.matches[0].post ();
            }
          }
        else {
          for (m in self.matches) {
            out.push (self.matches[m].post ());
            }
          return out;
          }
        },
      power: rbp,
      matches: [],
      push: function (val) {
        self.matches.push (val);
        },
      pop: function () {
        return self.matches.pop();
        },
      };
    return self;
    };

  function make_atom (text, type, state) {
    var self = {
      type: 'atom',
      subtype: type,
      text: text,
      state: state,
      post: function () {
        return self.text;
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
      table[prefix_table[i][0]] = make_pattern (prefix_table[i][0], [
          //make_literal (prefix_table[i][0]),
          make_right (prefix_table[i][2], 'prefix'),
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
      table[infix_table[i][0]] = make_pattern (infix_table[i][0], [
          make_left (infix_table[i][1]),
          //make_literal (infix_table[i][0]),
          make_right (infix_table[i][2], infix_table[i][3] ? 'indent' : 'prefix'),
          ]);
      }
    };

  function main () {
    var infix_state = make_state ('infix');
    var prefix_state = make_state ('prefix');
    var parser = make_parser ([infix_state, prefix_state], 'prefix', 'infix');
    fill_infix_table (infix_state.table);
    fill_prefix_table (prefix_state.table);
    parser.start ("-a + 1\nb * 40 - 1");
    //parser.start ("q = -a + 1\nb * 40 - 1");
    var res = parser.parse ();
    console.log (res);
    console.log (JSON.stringify(res));
    };
  main ();
  });
