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
    var self = {
      text: name,
      post: function () {
        return [self.text];
        //return self;
        },
      };
    return self;
    };

  function make_parser (states, startState) {
    var text = "";
    var idx  = 0;
    var state = startState || "start";
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
        //console.log ('Changing state to ' + stateName)
        if (theStates[stateName] === undefined) {
          throw new Error('Parser does not have state ' + stateName);
          }
        state = stateName;
        //state = theStates[stateName];
        //console.log (state);
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
          //console.log ('getToken')
          idx += match.text.length;
          }
        else {
          idx += tokenText.length;
          }
        if (match === undefined) {
          //console.log ('tokenTable')
          match = tokenTable[match];
          }
        if (match === undefined) {
          //console.log ('atom')
          match = make_atom (tokenText, type);
          }
        //console.log(match)
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
        accum.push (make_special ('(start)'));
        while (true) {
          token = self.lexOnce ();
          if (token !== null) {
            //console.log ('non-null token ')
            //console.log (token)
            if (token.type === 'pattern') {
              //console.log ('Processing pattern.');
              while (token.more ()) {
                var m = token.getMatcher ();
                if (m.type === 'left') {
                  //console.log('left')
                  //console.log (m);
                  //console.log (accum);
                  while (token.lbp >= accum.rbp) {
                    //console.log ('up');
                    accum = accum.parent;
                    }
                  //accum = accum.parent;
                  var a = accum.pop ();
                  //console.log ('a');
                  //console.log (a);
                  token.push (a);
                  //console.log ('accum:');
                  //console.log (accum);
                  //console.log (accum.matchers[0].matches);
                  //accum.push (token);
                  }
                else if (m.type === 'right') {
                  //console.log ('pushing');
                  //accum.push (m);
                  //console.log ('right');
                  accum.push (token);
                  accum = token;
                  self.changeState (m.next_state);
                  //token.idx -= 1;
                  break;
                  //token.advance ();
                  }
                else {
                  throw new Error ('Unsupported matcher type ' + m.type);
                  }
                }
              //accum = accum.parent || accum;
              //accum.push (token);
              }
            else {
              //console.log (accum);
              accum.push (token);
              if (!accum.more ()) {
                accum = accum.parent;
                }
              }
            //console.log('accum =');
            //console.log(accum)
            if (token.text === '(end)') {
              return root.post ();
              //return accum.post ();
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
          //console.log ('pattern.post:')
          var res = self.matchers[m].post ();
          //console.log (res);
            
          //console.log (self.matchers[m])
          out.push (res);
          }
        return out;
        },
      push: function (match) {
        //console.log ('pattern.push')
        //console.log (self)
        //console.log (match)

        //console.log (self)
        //console.log (self.matchers);
        //console.log (self.idx)
        match.parent = self;
        self.matchers[self.idx].push (match);
        if (self.matchers[self.idx].arity === 'single') {
          self.idx += 1;
          }
        },
      pop: function () {
        var out = self.matchers[self.idx].pop ();
        //self.idx -= 1;
        return out;
        },
      more: function () {
        return self.idx < self.matchers.length;
        },
      getMatcher: function () {
        return self.matchers[self.idx];
        },
      advance: function () {
        self.idx += 1;
        },
      };
    return self;
    };

  //function make_literal (token) {
    //var self = {
      //type: 'literal',
      //arity: 'single',
      ////post: function (parser) {
        ////return self.token;
        ////},
      ////pop: function () {
        ////return self;
        ////},
      //token: token,
      //};
    //return self;
    //};

  function make_left (lbp) {
    var self = {
      type: 'left',
      arity: 'single',
      post: function (parser) {
        var out = [];
        var m;
        if (self.arity === 'single') {
          if (self.matches[0]) {
            //console.log(self.matches[0])
            return self.matches[0].post ();
            }
          }
        else {
          for (m in self.matches) {
            //console.log(self.matches[m])
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

  function make_right (rbp, next_state, arity) {
    var self = {
      type: 'right',
      arity: arity || 'single',
      next_state: next_state,
      post: function (parser) {
        var out = [];
        var m;
        if (self.arity === 'single') {
          if (self.matches[0]) {
            //console.log ('right.post:')
            //console.log(self.matches[0])
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
        //console.log ('right.push:')
        //console.log (val);
        self.matches.push (val);
        },
      pop: function () {
        return self.matches.pop();
        },
      };
    return self;
    };

  function make_atom (text, type) {
    var self = {
      type: 'atom',
      subtype: type,
      text: text,
      post: function () {
        //self.parent = undefined;
        //return {
          //''
          //}
        //return self;
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
    var parser = make_parser ([infix_state, prefix_state], 'infix');
    fill_infix_table (infix_state.table);
    fill_prefix_table (prefix_state.table);
    parser.start ("a + 1\nb");
    var res = parser.parse ();
    console.log (res);
    };
  main ();
  });
